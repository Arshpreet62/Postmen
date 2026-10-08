import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import { RequestHistory } from "@/app/lib/models";
import { getAuthFromRequest } from "@/app/lib/auth";
import { deliver, reasonFor, MAX_BODY_BYTES } from "@/app/lib/deliver";
import { clientIp, rateLimit } from "@/app/lib/rate-limit";
import { toHeaderObject } from "@/app/lib/headers";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

// Bodies bigger than this are shown once but not kept in the outbox, so a
// single record stays well under MongoDB's 16 MB document limit.
const MAX_STORED_BODY = 1024 * 1024;

const USER_AGENT = "Postmen (+https://github.com/Arshpreet62/Postmen)";

function hasHeader(headers: Record<string, string>, name: string) {
  return Object.keys(headers).some((k) => k.toLowerCase() === name);
}

// A string body is sent as typed; anything else is serialised as JSON.
function toRequestBody(body: unknown): string | undefined {
  if (body === null || body === undefined || body === "") return undefined;
  return typeof body === "string" ? body : JSON.stringify(body);
}

const TEXTUAL = /^(text\/|application\/([\w.+-]*\+)?(json|xml|javascript|x-www-form-urlencoded|graphql|yaml|x-ndjson))/i;

// Text and JSON are shown as they are. Anything else (images, archives) is
// described instead of being turned into garbled text.
function decodeBody(buf: Buffer, contentType: string): unknown {
  const type = contentType.split(";")[0].trim();
  const text = buf.toString("utf8");
  if (type && !TEXTUAL.test(type)) {
    return `[${type} body, ${buf.length.toLocaleString("en")} bytes. Postmen shows text and JSON only.]`;
  }
  if (!type && text.includes("�")) {
    return `[Binary body, ${buf.length.toLocaleString("en")} bytes. Postmen shows text and JSON only.]`;
  }
  if (/json/i.test(type)) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

function forStorage(body: unknown) {
  const size = typeof body === "string" ? body.length : JSON.stringify(body ?? null).length;
  return size > MAX_STORED_BODY
    ? `[Body over 1 MB, not kept in the outbox. Send the request again to see it.]`
    : body;
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(`request:${clientIp(req)}`, 60, 60_000);
  if (limited) return limited;

  let input: { url?: unknown; method?: unknown; headers?: unknown; body?: unknown };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "The request to Postmen wasn't valid JSON." }, { status: 400 });
  }

  const url = typeof input.url === "string" ? input.url.trim() : "";
  const method = typeof input.method === "string" ? input.method.toUpperCase() : "GET";
  if (!url) {
    return NextResponse.json({ error: "Enter an address to send to." }, { status: 400 });
  }
  if (!METHODS.includes(method)) {
    return NextResponse.json({ error: `Postmen can't send ${method} requests.` }, { status: 400 });
  }

  const auth = getAuthFromRequest(req);
  const userId: string | null = auth?.id || null;
  // A token was sent but is expired or invalid: deliver anyway, unsaved,
  // and tell the client so it can sign the visitor out.
  const sessionExpired = !auth && !!req.headers.get("authorization")?.startsWith("Bearer ");

  const headers = toHeaderObject(input.headers);
  const outgoingBody = method !== "GET" && method !== "HEAD" ? toRequestBody(input.body) : undefined;
  if (outgoingBody && !hasHeader(headers, "content-type")) {
    headers["Content-Type"] = "application/json";
  }
  // Some APIs (GitHub's among them) turn away requests without these.
  const sendHeaders = { ...headers };
  if (!hasHeader(sendHeaders, "user-agent")) sendHeaders["User-Agent"] = USER_AGENT;
  if (!hasHeader(sendHeaders, "accept")) sendHeaders["Accept"] = "*/*";

  const sentAt = new Date();
  const started = performance.now();

  let response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    durationMs: number;
    sizeBytes: number;
    truncated?: boolean;
  };
  try {
    const d = await deliver(url, { method, headers: sendHeaders, body: outgoingBody });
    response = {
      status: d.status,
      statusText: d.statusText,
      headers: d.headers,
      body: decodeBody(d.body, d.headers["content-type"] || ""),
      durationMs: d.durationMs,
      sizeBytes: d.sizeBytes,
      ...(d.truncated ? { truncated: true } : {}),
    };
    if (d.truncated) {
      response.body = `${typeof response.body === "string" ? response.body : JSON.stringify(response.body)}\n\n[Cut off at ${MAX_BODY_BYTES / 1024 / 1024} MB.]`;
    }
  } catch (error) {
    // The proxy itself worked, so answer 200 and describe the failed
    // delivery in the payload; the client stamps it "Not delivered".
    response = {
      status: 0,
      statusText: "Not delivered",
      headers: {},
      body: { error: reasonFor(error) },
      durationMs: Math.round(performance.now() - started),
      sizeBytes: 0,
    };
  }

  // Filing a copy must never change what the visitor is told about the
  // delivery itself, so a storage failure only means "not saved".
  let savedToHistory = false;
  if (userId) {
    try {
      await dbConnect();
      await RequestHistory.create({
        user: userId,
        endpoint: url,
        method,
        timestamp: sentAt,
        request: { headers, body: outgoingBody ?? null },
        response: { ...response, body: forStorage(response.body) },
      });
      savedToHistory = true;
    } catch (e) {
      console.error("Saving to the outbox failed:", e);
    }
  }

  return NextResponse.json({
    request: { url, method, headers, body: outgoingBody ?? "" },
    response,
    sentAt: sentAt.toISOString(),
    savedToHistory,
    ...(sessionExpired ? { sessionExpired: true } : {}),
  });
}
