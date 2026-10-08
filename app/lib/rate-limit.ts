import { NextRequest, NextResponse } from "next/server";

// A small fixed-window limiter kept in memory. Each server instance counts
// on its own, so on serverless hosting it slows abuse down rather than
// stopping it outright; put a shared store (Redis, Upstash) behind this if
// Postmen gets real traffic.

type Window = { count: number; resetAt: number };
const buckets = new Map<string, Window>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, w] of buckets) if (w.resetAt <= now) buckets.delete(key);
}

export function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

// Returns a 429 response when the key is over its limit, otherwise null.
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  sweep(now);
  const w = buckets.get(key);
  if (!w || w.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  w.count += 1;
  if (w.count <= limit) return null;
  const retryAfter = Math.ceil((w.resetAt - now) / 1000);
  return NextResponse.json(
    { error: `Too many requests. Try again in ${retryAfter} seconds.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
