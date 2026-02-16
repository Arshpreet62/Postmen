import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/db";
import { User } from "@/app/lib/models";
import { signToken } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, remember } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && !user.password) {
      return NextResponse.json(
        { error: "Use Google sign-in for this account." },
        { status: 400 },
      );
    }

    const isMatch = user && (await bcrypt.compare(password, user.password));

    if (!user || !isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 },
      );
    }

    const expiresIn = remember ? "30d" : "24h";
    const token = signToken(
      {
        id: user._id.toString(),
        email: user.email,
      },
      expiresIn,
    );

    return NextResponse.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
