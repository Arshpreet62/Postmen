import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/db";
import { User } from "@/app/lib/models";
import { signToken } from "@/app/lib/auth";
import { clientIp, rateLimit } from "@/app/lib/rate-limit";

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

// bcrypt only looks at the first 72 bytes, so longer passwords are refused
// rather than silently cut.
function passwordProblem(password: string) {
  if (password.length < 8) return "Use at least 8 characters for your password.";
  if (Buffer.byteLength(password, "utf8") > 72) return "Use at most 72 characters for your password.";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`signup:${clientIp(req)}`, 5, 60 * 60_000);
    if (limited) return limited;

    const { email, password } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }
    const problem = passwordProblem(password);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "An account with that email already exists. Try signing in." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      authProvider: "local",
    });

    const token = signToken({ id: newUser._id.toString(), email: newUser.email });

    return NextResponse.json({ token, user: { id: newUser._id, email: newUser.email } }, { status: 201 });
  } catch (error) {
    // Two sign-ups racing for the same email: the unique index catches it.
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "An account with that email already exists. Try signing in." }, { status: 409 });
    }
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
