// Small helpers shared by the workbench, the outbox and the landing page.

export type Outcome = "delivered" | "redirected" | "returned" | "pending";

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
export type Method = (typeof METHODS)[number];

export type HeaderRow = { key: string; value: string };

export type Delivery = {
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    durationMs?: number;
    sizeBytes?: number;
    truncated?: boolean;
  };
  sentAt: string;
  savedToHistory?: boolean;
};

export function outcomeOf(status?: number): Outcome {
  if (status === undefined) return "pending";
  if (status >= 200 && status < 300) return "delivered";
  if (status >= 300 && status < 400) return "redirected";
  return "returned";
}

export function formatBytes(bytes?: number) {
  if (bytes === undefined || bytes === null) return "size not measured";
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

export function formatDuration(ms?: number) {
  if (ms === undefined || ms === null) return "time not measured";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function pathOf(url: string) {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return url;
  }
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export function postmarkDate(iso: string) {
  const d = new Date(iso);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    day: `${pad(d.getDate())} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function prettyBody(body: unknown) {
  if (body === null || body === undefined || body === "") return "";
  if (typeof body === "string") return body;
  return JSON.stringify(body, null, 2);
}

export function fetchSnippet(req: Delivery["request"]) {
  const lines = [`await fetch(${JSON.stringify(req.url)}, {`, `  method: ${JSON.stringify(req.method)},`];
  if (Object.keys(req.headers || {}).length) {
    lines.push(`  headers: ${JSON.stringify(req.headers, null, 2).replace(/\n/g, "\n  ")},`);
  }
  if (req.body) lines.push(`  body: ${JSON.stringify(req.body)},`);
  lines.push("});");
  return lines.join("\n");
}

// Shell-quote for the cURL snippet: wrap in single quotes, escape the rest.
const sq = (v: string) => `'${v.replace(/'/g, `'\\''`)}'`;

export function curlSnippet(req: Delivery["request"]) {
  const parts = [`curl${req.method === "GET" ? "" : ` -X ${req.method}`} ${sq(req.url)}`];
  for (const [k, v] of Object.entries(req.headers || {})) parts.push(`-H ${sq(`${k}: ${v}`)}`);
  if (req.body) parts.push(`--data-raw ${sq(req.body)}`);
  return parts.join(" \\\n  ");
}

// Split a shell command into words the way bash would for the quoting
// people actually paste: '...', "...", $'...' and backslash line breaks.
function shellWords(cmd: string): string[] {
  const s = cmd.replace(/\\\r?\n/g, " ");
  const out: string[] = [];
  let cur = "";
  let inWord = false;
  let quote: "'" | '"' | "$" | null = null;
  const ansi: Record<string, string> = { n: "\n", t: "\t", r: "\r", "\\": "\\", "'": "'", '"': '"' };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote === "'") {
      if (c === "'") quote = null;
      else cur += c;
    } else if (quote === "$") {
      if (c === "'") quote = null;
      else if (c === "\\" && i + 1 < s.length) cur += ansi[s[++i]] ?? s[i];
      else cur += c;
    } else if (quote === '"') {
      if (c === '"') quote = null;
      else if (c === "\\" && '"\\$`'.includes(s[i + 1] ?? "")) cur += s[++i];
      else cur += c;
    } else if (c === "$" && s[i + 1] === "'") {
      quote = "$";
      inWord = true;
      i++;
    } else if (c === "'" || c === '"') {
      quote = c;
      inWord = true;
    } else if (c === "\\" && i + 1 < s.length) {
      cur += s[++i];
      inWord = true;
    } else if (/\s/.test(c)) {
      if (inWord) out.push(cur);
      cur = "";
      inWord = false;
    } else {
      cur += c;
      inWord = true;
    }
  }
  if (inWord) out.push(cur);
  return out;
}

// Flags that take a value Postmen has no use for; skip the value too.
const SKIP_WITH_VALUE = new Set([
  "-o", "--output", "-m", "--max-time", "--connect-timeout", "-x", "--proxy", "-w", "--write-out",
  "--retry", "-F", "--form", "-T", "--upload-file", "--cacert", "--cert", "--key", "-E", "-r", "--range",
]);

export type ImportedRequest = { method: string; url: string; headers: HeaderRow[]; body: string };

// Turn a pasted "curl ..." command (from docs, or a browser's Copy as cURL)
// into a request. Returns null if it isn't a curl command.
export function parseCurl(cmd: string): ImportedRequest | null {
  const words = shellWords(cmd.trim());
  if (words[0] !== "curl") return null;
  let method = "";
  let url = "";
  let get = false;
  let json = false;
  const headers: HeaderRow[] = [];
  const data: string[] = [];
  const header = (key: string, value: string) => headers.push({ key, value });

  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    const eq = w.startsWith("--") ? w.indexOf("=") : -1;
    const flag = eq > 0 ? w.slice(0, eq) : w;
    const value = () => (eq > 0 ? w.slice(eq + 1) : (words[++i] ?? ""));
    if (/^-X./.test(w)) {
      method = w.slice(2).toUpperCase();
      continue;
    }
    switch (flag) {
      case "-X":
      case "--request":
        method = value().toUpperCase();
        break;
      case "-H":
      case "--header": {
        const h = value();
        const at = h.indexOf(":");
        if (at > 0) header(h.slice(0, at).trim(), h.slice(at + 1).trim());
        break;
      }
      case "-d":
      case "--data":
      case "--data-raw":
      case "--data-binary":
      case "--data-ascii":
      case "--data-urlencode":
        data.push(value());
        break;
      case "--json":
        data.push(value());
        json = true;
        break;
      case "-u":
      case "--user":
        try {
          header("Authorization", `Basic ${btoa(value())}`);
        } catch {}
        break;
      case "-A":
      case "--user-agent":
        header("User-Agent", value());
        break;
      case "-b":
      case "--cookie":
        header("Cookie", value());
        break;
      case "-e":
      case "--referer":
        header("Referer", value());
        break;
      case "-I":
      case "--head":
        method = "HEAD";
        break;
      case "-G":
      case "--get":
        get = true;
        break;
      case "--url":
        url = value();
        break;
      default:
        if (SKIP_WITH_VALUE.has(flag)) value();
        else if (!w.startsWith("-") && !url) url = w;
    }
  }
  if (!url) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = `http://${url}`;

  let body = data.join("&");
  if (get && body) {
    url += (url.includes("?") ? "&" : "?") + body;
    body = "";
  }
  const has = (name: string) => headers.some((h) => h.key.toLowerCase() === name);
  if (json && !has("content-type")) header("Content-Type", "application/json");
  if (json && !has("accept")) header("Accept", "application/json");
  if (!method) method = body ? "POST" : "GET";
  return { method, url, headers, body };
}

export type JsonToken = { text: string; kind?: "k" | "s" | "n" | "b" };

// Colour pretty-printed JSON: keys, strings, numbers, and true/false/null.
export function jsonTokens(text: string): JsonToken[] {
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  const out: JsonToken[] = [];
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    if (m[1]) {
      out.push({ text: m[1], kind: m[2] ? "k" : "s" });
      if (m[2]) out.push({ text: m[2] });
    } else {
      out.push({ text: m[0], kind: m[3] ? "b" : "n" });
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

// Keep the query-params table and the address in step.
export function paramsFromUrl(url: string): HeaderRow[] {
  try {
    const u = new URL(url);
    return [...u.searchParams.entries()].map(([key, value]) => ({ key, value }));
  } catch {
    return [];
  }
}

export function urlWithParams(url: string, params: HeaderRow[]) {
  try {
    const u = new URL(url);
    u.search = "";
    params.filter((p) => p.key.trim()).forEach((p) => u.searchParams.append(p.key.trim(), p.value));
    return u.toString();
  } catch {
    return url;
  }
}
