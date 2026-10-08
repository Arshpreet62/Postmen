import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";
import zlib from "node:zlib";
import type { Readable } from "node:stream";

// Sends one request on behalf of a visitor, the way a mail carrier would:
// only to public addresses, with a time limit and a weight limit.
//
// Postmen's server makes the request, so without these checks anyone could
// use it to read internal services (cloud metadata, databases, the app's
// own API) or tie it up with an endless download.

export const TIMEOUT_MS = 20_000;
export const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;

// Set ALLOW_PRIVATE_ADDRESSES=true only when Postmen runs on your own
// machine and you want to test APIs on localhost or your network.
const allowPrivate = () => process.env.ALLOW_PRIVATE_ADDRESSES === "true";

export class DeliveryError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function ipv4Public(ip: string) {
  const [a, b, c] = ip.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127) return false; // this network, private, loopback
  if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
  if (a === 169 && b === 254) return false; // link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false; // private
  if (a === 192 && b === 168) return false; // private
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false; // protocol assignments, docs
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a === 198 && b === 51 && c === 100) return false; // docs
  if (a === 203 && b === 0 && c === 113) return false; // docs
  if (a >= 224) return false; // multicast, reserved, broadcast
  return true;
}

// Expand an IPv6 address to eight 16-bit groups.
function ipv6Groups(ip: string): number[] | null {
  let s = ip.toLowerCase().split("%")[0];
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const [a, b, c, d] = v4[1].split(".").map(Number);
    s = s.slice(0, -v4[1].length) + ((a << 8) | b).toString(16) + ":" + ((c << 8) | d).toString(16);
  }
  const [head, tail] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined && tail ? tail.split(":") : [];
  const fill = s.includes("::") ? 8 - h.length - t.length : 0;
  const groups = [...h, ...Array(fill).fill("0"), ...t].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => g >= 0 && g <= 0xffff) ? groups : null;
}

const v4From = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

export function isPublicAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return ipv4Public(ip);
  if (!net.isIPv6(ip)) return false;
  const g = ipv6Groups(ip);
  if (!g) return false;
  const zeros = (n: number) => g.slice(0, n).every((x) => x === 0);
  if (zeros(5) && g[5] === 0xffff) return ipv4Public(v4From(g[6], g[7])); // IPv4-mapped
  if (g[0] === 0x64 && g[1] === 0xff9b) return ipv4Public(v4From(g[6], g[7])); // NAT64
  if (g[0] === 0x2002) return ipv4Public(v4From(g[1], g[2])); // 6to4
  if (g[0] === 0x2001 && g[1] === 0) return false; // Teredo
  if (g[0] === 0x2001 && g[1] === 0xdb8) return false; // documentation
  // Everything else outside global unicast (2000::/3) is loopback,
  // unspecified, unique-local, link-local, multicast or reserved.
  return (g[0] & 0xe000) === 0x2000;
}

// Resolves a host name and refuses to connect if any address it resolves
// to is private. Because this runs at connect time, a host that resolves
// to a public address once and a private one later still can't get in.
function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    const list = addresses as dns.LookupAddress[];
    if (!allowPrivate() && (list.length === 0 || list.some((a) => !isPublicAddress(a.address)))) {
      return callback(new DeliveryError("EBLOCKED", "blocked"), "");
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

function checkUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new DeliveryError("EBADURL", "That isn't a full web address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new DeliveryError("EBADURL", "Only http:// and https:// addresses can be sent.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  // IP literals skip DNS, so check them here.
  if (!allowPrivate() && net.isIP(host) && !isPublicAddress(host)) {
    throw new DeliveryError("EBLOCKED", "blocked");
  }
  return url;
}

export type Delivered = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: Buffer;
  sizeBytes: number;
  truncated: boolean;
  durationMs: number;
  finalUrl: string;
};

type Outgoing = { method: string; headers: Record<string, string>; body?: string };

function decoder(encoding: string | undefined): zlib.Gunzip | zlib.Inflate | zlib.BrotliDecompress | null {
  switch ((encoding || "").trim().toLowerCase()) {
    case "gzip":
    case "x-gzip":
      return zlib.createGunzip();
    case "deflate":
      return zlib.createInflate();
    case "br":
      return zlib.createBrotliDecompress();
    default:
      return null;
  }
}

function once(url: URL, out: Outgoing, signal: AbortSignal) {
  return new Promise<http.IncomingMessage>((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const headers: Record<string, string> = { ...out.headers };
    if (out.body !== undefined) headers["Content-Length"] = String(Buffer.byteLength(out.body));
    let req: http.ClientRequest;
    try {
      req = client.request(url, {
        method: out.method,
        headers,
        signal,
        lookup: guardedLookup as unknown as net.LookupFunction,
      });
    } catch (e) {
      // Invalid header names or values throw before anything is sent.
      const code = (e as NodeJS.ErrnoException).code || "";
      return reject(
        code.startsWith("ERR_INVALID")
          ? new DeliveryError("EBADHEADER", "A header name or value has characters HTTP doesn't allow.")
          : e,
      );
    }
    req.on("response", resolve);
    req.on("error", reject);
    req.end(out.body);
  });
}

// Reads the body up to the weight limit. sizeBytes counts bytes as they
// arrived on the wire, before any decompression.
async function readBody(res: http.IncomingMessage) {
  const chunks: Buffer[] = [];
  let sizeBytes = 0;
  let kept = 0;
  let truncated = false;
  const unzip = decoder(res.headers["content-encoding"] as string | undefined);
  const source: Readable = unzip ? res.pipe(unzip) : res;
  if (unzip) {
    res.on("data", (c: Buffer) => {
      sizeBytes += c.length;
    });
  }
  for await (const chunk of source) {
    const c = chunk as Buffer;
    if (!unzip) sizeBytes += c.length;
    if (kept + c.length > MAX_BODY_BYTES) {
      chunks.push(c.subarray(0, MAX_BODY_BYTES - kept));
      truncated = true;
      res.destroy();
      break;
    }
    kept += c.length;
    chunks.push(c);
  }
  return { body: Buffer.concat(chunks), sizeBytes, truncated };
}

function flatHeaders(res: http.IncomingMessage): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(res.headers)) {
    if (v === undefined) continue;
    // Several Set-Cookie headers stay separate lines instead of the last one winning.
    out[k] = Array.isArray(v) ? v.join("\n") : v;
  }
  return out;
}

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export async function deliver(rawUrl: string, out: Outgoing): Promise<Delivered> {
  const url = checkUrl(rawUrl);
  const current: Outgoing = { ...out, headers: { ...out.headers } };
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const started = performance.now();

  try {
    return await follow(url, current, signal, started);
  } catch (e) {
    // An abort surfaces as a reset socket; say what actually happened.
    if (signal.aborted) throw new DeliveryError("ETIMEOUT", `The server took longer than ${TIMEOUT_MS / 1000} seconds.`);
    throw e;
  }
}

async function follow(url: URL, current: Outgoing, signal: AbortSignal, started: number): Promise<Delivered> {
  for (let hop = 0; ; hop++) {
    const res = await once(url, current, signal);
    const status = res.statusCode || 0;
    const location = res.headers.location;

    if (REDIRECTS.has(status) && location && hop < MAX_REDIRECTS) {
      res.resume();
      const next = checkUrl(new URL(location, url).toString());
      // Same rules browsers follow: 303, and 301/302 after a POST, become a GET.
      if (status === 303 || ((status === 301 || status === 302) && current.method === "POST")) {
        current = { method: "GET", headers: { ...current.headers } };
        for (const k of Object.keys(current.headers)) {
          if (/^content-(type|length)$/i.test(k)) delete current.headers[k];
        }
      }
      // Credentials don't follow a redirect to another site.
      if (next.origin !== url.origin) {
        for (const k of Object.keys(current.headers)) {
          if (/^(authorization|cookie)$/i.test(k)) delete current.headers[k];
        }
      }
      url = next;
      continue;
    }

    const { body, sizeBytes, truncated } = await readBody(res);
    return {
      status,
      statusText: res.statusMessage || "",
      headers: flatHeaders(res),
      body,
      sizeBytes,
      truncated,
      durationMs: Math.round(performance.now() - started),
      finalUrl: url.toString(),
    };
  }
}

// Plain-language reasons for the ways a delivery can fail.
const REASONS: Record<string, string> = {
  EBLOCKED: "Postmen doesn't send requests to private or internal addresses.",
  ECONNREFUSED: "The server refused the connection.",
  ENOTFOUND: "No server was found at that host name.",
  EAI_AGAIN: "The host name couldn't be looked up.",
  ETIMEDOUT: "The server didn't answer in time.",
  ECONNRESET: "The server closed the connection.",
  EPROTO: "The secure connection couldn't be set up.",
  CERT_HAS_EXPIRED: "The server's TLS certificate has expired.",
  DEPTH_ZERO_SELF_SIGNED_CERT: "The server's TLS certificate is self-signed.",
  SELF_SIGNED_CERT_IN_CHAIN: "The server's TLS certificate isn't trusted.",
  ERR_TLS_CERT_ALTNAME_INVALID: "The server's TLS certificate is for a different host name.",
  HPE_INVALID_CONSTANT: "The server's answer wasn't valid HTTP.",
  Z_DATA_ERROR: "The server said the body was compressed, but it couldn't be decompressed.",
};

export function reasonFor(error: unknown): string {
  const e = error as NodeJS.ErrnoException & { name?: string };
  if (e instanceof DeliveryError && e.code !== "EBLOCKED") return e.message;
  if (e?.name === "TimeoutError" || e?.name === "AbortError") {
    return `The server took longer than ${TIMEOUT_MS / 1000} seconds.`;
  }
  const code = e?.code || "";
  return REASONS[code] || (code ? `The request failed (${code}).` : "The request failed.");
}
