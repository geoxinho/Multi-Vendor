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

/**
 * Sends a welcome email upon successful signup.
 */
export async function sendWelcomeEmail(email: string, name: string) {
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
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: "Welcome to MarketHub!",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Welcome to MarketHub, ${name}!</h2>
            <p>Your account has been created successfully. You can now start buying and selling on our platform.</p>
          </div>
        `,
      });
      console.log(`[EMAIL] Welcome email sent to ${email}`);
    } catch (err) {
      console.error("[EMAIL ERROR] Failed to send welcome email:", err);
    }
  } else {
    console.log(`[MOCK EMAIL] Welcome email to ${email}`);
  }
}

/**
 * Sends order confirmation emails to buyer and seller(s).
 */
export async function sendOrderConfirmationEmails(order: any, buyerEmail: string, buyerName: string, sellerEmails: string[]) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "MarketHub <no-reply@markethub.com>";

  const hasSMTP = smtpHost && smtpUser && smtpPass;

  // Buyer Email
  const buyerHtml = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Order Confirmation</h2>
      <p>Hi ${buyerName},</p>
      <p>Thank you for your order! Your payment was successful.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #b91c1c;">⚠️ IMPORTANT: Delivery PIN</h3>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1f2937;">${order.deliveryPin}</p>
        <p style="color: #b91c1c; font-weight: bold;">Do NOT disclose this PIN to the seller until they have physically delivered the product to you. The seller needs this PIN to mark the order as delivered and receive their payment.</p>
      </div>
      <p>Total Amount: ₦${order.totalAmount.toLocaleString()}</p>
    </div>
  `;

  // Seller Email (generic)
  const sellerHtml = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>New Order Received!</h2>
      <p>Congratulations! A buyer has purchased one or more of your products.</p>
      <p>Please check your seller dashboard for shipping details.</p>
      <p><strong>Note:</strong> You will need to ask the buyer for their 6-digit Delivery PIN when you deliver the product. Enter the PIN in your dashboard to mark the order as delivered and initiate your payout.</p>
    </div>
  `;

  if (hasSMTP) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      // Send to buyer
      await transporter.sendMail({
        from: smtpFrom,
        to: buyerEmail,
        subject: "Order Confirmation & Delivery PIN - MarketHub",
        html: buyerHtml,
      });

      // Send to sellers
      for (const email of sellerEmails) {
        if (email) {
          await transporter.sendMail({
            from: smtpFrom,
            to: email,
            subject: "New Order Received - MarketHub",
            html: sellerHtml,
          });
        }
      }
      console.log(`[EMAIL] Order emails sent for order ${order._id}`);
    } catch (err) {
      console.error("[EMAIL ERROR] Failed to send order emails:", err);
    }
  } else {
    console.log(`[MOCK EMAIL] Order Confirmation to Buyer (${buyerEmail}). PIN: ${order.deliveryPin}`);
    console.log(`[MOCK EMAIL] New Order Alert to Sellers: ${sellerEmails.join(", ")}`);
  }
}

