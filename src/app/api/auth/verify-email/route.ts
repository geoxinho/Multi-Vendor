import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

// GET /api/auth/verify-email?token=... — Verifies the token and activates the account
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "The verification link is invalid or has expired. Please register again." },
        { status: 400 }
      );
    }

    // Activate user email
    user.isEmailVerified = true;
    user.emailVerificationToken = "";
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
  } catch (err) {
    console.error("[EMAIL VERIFICATION GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
