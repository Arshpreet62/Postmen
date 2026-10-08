import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthFromRequest, signToken, MAX_SESSION_SECONDS } from "@/app/lib/auth";
import dbConnect from "@/app/lib/db";
import { User } from "@/app/lib/models";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // A token can be swapped for a fresh one, but a session never outlives
    // MAX_SESSION_SECONDS from the original sign-in.
    const signedInAt = auth.auth_time ?? auth.iat ?? 0;
    const remaining = signedInAt + MAX_SESSION_SECONDS - Math.floor(Date.now() / 1000);
    if (remaining <= 60) {
      return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(auth.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(auth.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const newToken = signToken(
      { id: user._id.toString(), email: user.email, auth_time: signedInAt },
      `${Math.min(24 * 60 * 60, remaining)}s`,
    );

    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
