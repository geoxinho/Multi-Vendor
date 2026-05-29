import nodemailer from "nodemailer";

/**
 * Sends a verification email to the user.
 * Falls back to printing a highly visible local verification link in the console 
 * if SMTP variables are not configured in the environment.
 */
export async function sendVerificationEmail(email: string, token: string) {
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${nextAuthUrl}/auth/verify-email?token=${token}`;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "MarketHub <no-reply@markethub.com>";

  const hasSMTP = smtpHost && smtpUser && smtpPass;

  if (hasSMTP) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: smtpFrom,
        to: email,
        subject: "Verify your MarketHub Account",
        text: `Welcome to MarketHub! Please verify your email by clicking: ${verifyUrl}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="font-weight: 800; font-size: 24px; color: #111827;">Market<span style="color: #16a34a;">Hub</span></span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 12px; text-align: center;">Verify Your Email Address</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              Welcome to MarketHub! To complete your registration and unlock full access to buying and selling, please verify your email address.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${verifyUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 30px; border-radius: 12px; text-decoration: none; transition: background-color 0.2s;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
              If the button doesn't work, copy and paste this link into your browser: <br/>
              <a href="${verifyUrl}" style="color: #16a34a; word-break: break-all;">${verifyUrl}</a>
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Verification email sent successfully to ${email}`);
      return true;
    } catch (err) {
      console.error("[EMAIL ERROR] Failed to send actual email via SMTP, falling back to console log:", err);
    }
  }

  // Developer/Local Fallback
  console.log("\n" + "=".repeat(60));
  console.log("[DEVELOPMENT MOCK EMAIL]");
  console.log(`To:      ${email}`);
  console.log("Subject: Verify your MarketHub account");
  console.log(`Link:    ${verifyUrl}`);
  console.log("=".repeat(60) + "\n");
  return true;
}
