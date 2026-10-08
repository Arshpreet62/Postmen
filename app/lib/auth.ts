import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export type AuthPayload = { id: string; email: string; auth_time?: number; iat?: number; exp?: number };

// Read at call time, not import time: `next build` imports route modules
// without production secrets. There is deliberately no fallback value, since
// a known default would let anyone sign their own tokens.
function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set.");
  if (s.length < 32 && !warned) {
    warned = true;
    console.warn("JWT_SECRET is shorter than 32 characters. Use a long random value.");
  }
  return s;
}
let warned = false;

// Sessions can be refreshed, but never past this long after signing in.
export const MAX_SESSION_SECONDS = 30 * 24 * 60 * 60;

export function signToken(payload: { id: string; email: string; auth_time?: number }, expiresIn: string = "24h") {
  const claims = { id: payload.id, email: payload.email, auth_time: payload.auth_time ?? Math.floor(Date.now() / 1000) };
  return jwt.sign(claims, secret(), { expiresIn: expiresIn as jwt.SignOptions["expiresIn"], algorithm: "HS256" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload !== "object" || typeof payload.id !== "string") return null;
    return payload as AuthPayload;
  } catch (error) {
    if ((error as Error).message === "JWT_SECRET is not set.") throw error;
    return null;
  }
}

export function getAuthFromRequest(req: NextRequest): AuthPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return verifyToken(authHeader.slice(7));
}
