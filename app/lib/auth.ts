import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret";

export function signToken(
  payload: { id: string; email: string },
  expiresIn: string = "24h",
) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
  return token;
}

export function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export function getAuthFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  return payload as any;
}
