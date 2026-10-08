import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import dbConnect from "@/app/lib/db";
import { User } from "@/app/lib/models";
import { signToken } from "@/app/lib/auth";

// The browser needs NEXT_PUBLIC_GOOGLE_CLIENT_ID anyway; use it here too if
// the server-only variable isn't set.
const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(googleClientId);

export async function POST(req: NextRequest) {
  try {
    if (!googleClientId) {
      return NextResponse.json(
        { error: "Google auth is not configured." },
        { status: 500 },
      );
    }

    const { credential } = await req.json().catch(() => ({}));
    if (typeof credential !== "string" || !credential) {
      return NextResponse.json(
        { error: "Missing Google credential." },
        { status: 400 },
      );
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) {
      return NextResponse.json(
        { error: "Google didn't confirm this account's email address." },
        { status: 400 },
      );
    }

    await dbConnect();

    const email = payload.email.toLowerCase();
    let user = (await User.findOne({ googleId: payload.sub })) ?? (await User.findOne({ email }));

    // An account made with a password is not joined to a Google login by
    // email alone: anyone can sign up with someone else's address, and would
    // then share an account with them once they use Google.
    if (user && !user.googleId && user.password) {
      return NextResponse.json(
        { error: "This email already has a Postmen password. Sign in with it instead." },
        { status: 409 },
      );
    }

    if (!user) {
      user = new User({
        email,
        authProvider: "google",
        googleId: payload.sub,
        name: payload.name || "",
        avatar: payload.picture || "",
      });
      await user.save();
    } else {
      const updates: Record<string, string> = {};
      if (!user.googleId && payload.sub) updates.googleId = payload.sub;
      if (!user.name && payload.name) updates.name = payload.name;
      if (!user.avatar && payload.picture) updates.avatar = payload.picture;
      if (!user.authProvider) updates.authProvider = "google";
      if (Object.keys(updates).length > 0) {
        user.set(updates);
        await user.save();
      }
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
    });

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || undefined,
        avatar: user.avatar || undefined,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
