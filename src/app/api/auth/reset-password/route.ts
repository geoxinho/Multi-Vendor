import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = "";
    user.passwordResetTokenExpires = undefined;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("[RESET PASSWORD]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
