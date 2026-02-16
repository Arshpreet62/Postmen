import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/db";
import { User } from "@/app/lib/models";
import { signToken } from "@/app/lib/auth";

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password: string): boolean => password.length >= 6;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 },
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists." },
        { status: 400 },
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      authProvider: "local",
    });
    await newUser.save();

    const token = signToken({
      id: newUser._id.toString(),
      email: newUser.email,
    });

    return NextResponse.json(
      {
        token,
        user: { id: newUser._id, email: newUser.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
