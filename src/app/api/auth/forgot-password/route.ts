import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { sendMail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    user.passwordResetToken = token;
    user.passwordResetTokenExpires = expires;
    await user.save();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://closevendors.vercel.app";
    const resetUrl = `${siteUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendMail({
      to: user.email,
      subject: "Reset your MarketHub password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
          <div style="background: #059669; padding: 32px 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">MarketHub</h1>
          </div>
          <div style="padding: 40px;">
            <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px;">Password Reset Request</h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
              Hi <strong style="color: #111827;">${user.name}</strong>,<br/><br/>
              We received a request to reset the password for your MarketHub account. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}"
              style="display: inline-block; background: #059669; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; margin-bottom: 28px;">
              Reset My Password
            </a>
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
              If you didn't request this, you can safely ignore this email. Your password won't change.<br/><br/>
              Or copy this link:<br/>
              <span style="color: #059669; word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("[FORGOT PASSWORD]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
