import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/db";
import { User } from "@/app/lib/models";
import { signToken } from "@/app/lib/auth";
import { clientIp, rateLimit } from "@/app/lib/rate-limit";

// Compared against when there's no such user, so a missing account takes
// as long to reject as a wrong password.
const DUMMY_HASH = "$2b$10$zhETNZbBWPOAcoaRZ.N/e.1WZqHNwY1yvvloaYOzCTOp1DoX8sS0.";

const INVALID = "That email and password don't match an account.";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
    if (limited) return limited;

    const { email, password, remember } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const byEmail = rateLimit(`login:${email.toLowerCase()}`, 10, 15 * 60_000);
    if (byEmail) return byEmail;

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() });
    // Google-only accounts have no password; they get the same answer as a
    // wrong password so the response doesn't reveal which accounts exist.
    const isMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH);
    if (!user || !user.password || !isMatch) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    const token = signToken({ id: user._id.toString(), email: user.email }, remember ? "30d" : "24h");

    return NextResponse.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
