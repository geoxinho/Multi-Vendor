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

    // Always return success message (prevents email enumeration)
    if (!user) {
      return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
    }

    // Generate secure reset token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    user.passwordResetToken = token;
    user.passwordResetTokenExpires = expires;
    await user.save();

    // Dynamically detect origin so the link always points to the exact active domain
    const origin =
      req.headers.get("origin") ||
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://campusgo.vercel.app";

    const resetUrl = `${origin}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendMail({
      to: user.email,
      subject: "🔒 Reset Your CampusGo Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #A4860E, #c9a72a); padding: 32px 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">CampusGo</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Adeleke University Marketplace</p>
          </div>
          <div style="padding: 36px 40px;">
            <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px;">Password Reset Request</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Hi <strong>${user.name}</strong>,<br/><br/>
              We received a request to reset your password for your CampusGo account. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
            </p>
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${resetUrl}"
                style="display: inline-block; background: #A4860E; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 12px rgba(164,134,14,0.25);">
                Set New Password
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
              If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.<br/><br/>
              Having trouble with the button? Copy and paste this link into your browser:<br/>
              <span style="color: #A4860E; word-break: break-all; font-family: monospace;">${resetUrl}</span>
            </p>
          </div>
          <div style="background: #f9fafb; padding: 16px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">CampusGo · Adeleke University Campus Marketplace</p>
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
