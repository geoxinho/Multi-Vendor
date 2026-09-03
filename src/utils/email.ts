import { getTransporter } from "@/lib/email";

/**
 * Sends a verification email to the user.
 * Falls back to printing a highly visible local verification link in the console 
 * if SMTP variables are not configured in the environment.
 */
export async function sendVerificationEmail(email: string, otp: string) {
  const { transporter, hasSMTP, user } = getTransporter();
  let smtpFrom = process.env.SMTP_FROM
    ? process.env.SMTP_FROM.trim().replace(/^["']|["']$/g, "")
    : `CampusGo <${user || "no-reply@CampusGo.com"}>`;
  if (!smtpFrom.includes("<") && user) {
    smtpFrom = `"${smtpFrom}" <${user}>`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://campusgo.vercel.app");

  if (hasSMTP && transporter) {
    try {
      const mailOptions = {
        from: smtpFrom,
        to: email.trim(),
        subject: "Verify your CampusGo Account",
        text: `Welcome to CampusGo! Your verification code is: ${otp}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
              <img src="${siteUrl}/main_logo.png" alt="CampusGo Logo" style="height: 52px; width: auto; max-width: 220px; object-fit: contain; margin: 0 auto 12px; display: block;" />
              <span style="font-weight: 800; font-size: 20px; color: #111827;">Campus<span style="color: #A4860E;">GO</span></span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 12px; text-align: center;">Verify Your Email Address</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              Welcome to CampusGo! To complete your registration, please enter the 6-digit verification code below:
            </p>
            <div style="text-align: center; margin-bottom: 24px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #A4860E;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
              This code will expire in 24 hours.
            </p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Verification email sent successfully to ${email}. ID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error("[EMAIL ERROR] Failed to send email via SMTP:", err);
    }
  }

  // Developer/Local Fallback
  console.log("\n" + "=".repeat(60));
  console.log("[DEVELOPMENT MOCK EMAIL]");
  console.log(`To:      ${email}`);
  console.log("Subject: Verify your CampusGo account");
  console.log(`OTP Code: ${otp}`);
  console.log("=".repeat(60) + "\n");
  return true;
}

/**
 * Sends a welcome email upon successful signup.
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const { transporter, hasSMTP, user } = getTransporter();
  let smtpFrom = process.env.SMTP_FROM
    ? process.env.SMTP_FROM.trim().replace(/^["']|["']$/g, "")
    : `CampusGo <${user || "no-reply@CampusGo.com"}>`;
  if (!smtpFrom.includes("<") && user) {
    smtpFrom = `"${smtpFrom}" <${user}>`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://campusgo.vercel.app");
  const firstName = name.split(" ")[0] || name;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to CampusGo!</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${siteUrl}/main_logo.png" alt="CampusGo" style="height:56px;width:auto;max-width:200px;display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Hero Card -->
          <tr>
            <td style="background:linear-gradient(135deg,#A4860E 0%,#c9a72a 60%,#e8c84a 100%);border-radius:20px 20px 0 0;padding:48px 40px 40px;text-align:center;">
              <div style="width:72px;height:72px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                <!-- checkmark icon approximated with text -->
                <span style="font-size:36px;line-height:72px;display:block;">🎉</span>
              </div>
              <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0 0 10px;letter-spacing:-0.5px;">
                Welcome aboard, ${firstName}!
              </h1>
              <p style="color:rgba(255,255,255,0.9);font-size:15px;margin:0;line-height:1.6;">
                Your CampusGo account is now active and ready to go.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;">

              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">
                Hi <strong>${name}</strong>, we're thrilled to have you join the CampusGo community — Nigeria's dedicated campus marketplace built exclusively for university and polytechnic students like you.
              </p>

              <!-- Feature Highlights -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:14px 16px;background:#fdf8e8;border-radius:12px;border:1px solid #e8d48a;margin-bottom:10px;display:block;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" valign="middle">
                          <div style="width:36px;height:36px;background:#A4860E;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">🛒</div>
                        </td>
                        <td style="padding-left:14px;" valign="middle">
                          <p style="margin:0;font-weight:700;color:#111827;font-size:14px;">Buy with Confidence</p>
                          <p style="margin:2px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">All payments are held in escrow and released only after delivery is confirmed with a PIN.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:14px 16px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" valign="middle">
                          <div style="width:36px;height:36px;background:#16a34a;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">💰</div>
                        </td>
                        <td style="padding-left:14px;" valign="middle">
                          <p style="margin:0;font-weight:700;color:#111827;font-size:14px;">Sell to Classmates</p>
                          <p style="margin:2px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">List your items in seconds and get paid directly into your bank account when orders are confirmed.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:14px 16px;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" valign="middle">
                          <div style="width:36px;height:36px;background:#2563eb;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">🏫</div>
                        </td>
                        <td style="padding-left:14px;" valign="middle">
                          <p style="margin:0;font-weight:700;color:#111827;font-size:14px;">Campus-Scoped Listings</p>
                          <p style="margin:2px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">You only see and trade with verified students at your campus — keeping it safe and local.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#A4860E,#c9a72a);color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:15px 40px;border-radius:12px;letter-spacing:-0.2px;box-shadow:0 4px 14px rgba(164,134,14,0.35);">
                      Start Exploring CampusGo →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;margin:0;">
                Have questions? Visit our <a href="${siteUrl}/help" style="color:#A4860E;text-decoration:none;font-weight:600;">Help Centre</a> anytime.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <img src="${siteUrl}/main_logo.png" alt="CampusGo" style="height:28px;width:auto;margin:0 auto 10px;display:block;opacity:0.6;" />
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.7;">
                © ${new Date().getFullYear()} CampusGo · Campus Marketplace for Nigerian Students<br />
                You received this email because you created an account at CampusGo.<br />
                This is an automated message — please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (hasSMTP && transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: email.trim(),
        subject: `🎉 Welcome to CampusGo, ${firstName}! Your account is ready`,
        html,
      });
      console.log(`[EMAIL] Welcome email sent to ${email}`);
    } catch (err) {
      console.error("[EMAIL ERROR] Failed sending welcome email:", err);
    }
  } else {
    console.log(`[MOCK EMAIL] Welcome email to: ${email} (Name: ${name})`);
  }
}

/**
 * Sends order confirmation emails to both the buyer and all sellers involved.
 */
export async function sendOrderConfirmationEmails(
  order: any,
  buyerEmail: string,
  buyerName: string,
  sellerItemsMap: Map<string, any[]>
) {
  const { transporter, hasSMTP, user } = getTransporter();
  let smtpFrom = process.env.SMTP_FROM
    ? process.env.SMTP_FROM.trim().replace(/^["']|["']$/g, "")
    : `CampusGo <${user || "no-reply@CampusGo.com"}>`;
  if (!smtpFrom.includes("<") && user) {
    smtpFrom = `"${smtpFrom}" <${user}>`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const itemRowsHtml = order.items
    .map(
      (item: any) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #f3f4f6;">
          <strong style="color:#111827;">${item.title}</strong>
          ${item.selectedSize ? `<br/><span style="font-size:12px;color:#6b7280;">Size: ${item.selectedSize}</span>` : ""}
          ${item.selectedColor ? `<span style="font-size:12px;color:#6b7280;"> | Color: ${item.selectedColor}</span>` : ""}
        </td>
        <td style="padding:10px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">₦${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  const buyerHtml = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:#A4860E;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:800;letter-spacing:-0.5px;">Order Confirmed! 🎉</h1>
        <p style="color:#fdf8e8;margin:6px 0 0;font-size:14px;">Thank you for shopping on CampusGo</p>
      </div>

      <div style="padding:32px;">
        <p style="font-size:15px;color:#374151;margin:0 0 20px;">Hi <strong>${buyerName}</strong>,</p>
        <p style="font-size:14px;color:#4b5563;margin:0 0 24px;line-height:1.6;">
          We have received your payment and notified the seller(s). Your order reference is <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong>.
        </p>

        <!-- Delivery PIN Box -->
        <div style="background:#fdf8e8;border:2px border-solid #e8d48a;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:1px;color:#8a6f0b;text-transform:uppercase;margin:0 0 6px;">Your Delivery Verification PIN</p>
          <span style="font-family:monospace;font-size:36px;font-weight:900;letter-spacing:8px;color:#A4860E;">${order.deliveryPin}</span>
          <p style="font-size:12px;color:#8a6f0b;margin:8px 0 0;line-height:1.5;">
            <strong>Keep this PIN safe.</strong> Share it with the seller ONLY after physically receiving and inspecting your package.
          </p>
        </div>

        <!-- Order Breakdown Table -->
        <h3 style="font-size:15px;font-weight:700;color:#111827;margin:0 0 12px;">Order Summary</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <thead>
            <tr style="background:#f9fafb;color:#6b7280;font-size:12px;text-transform:uppercase;">
              <th style="padding:8px 10px;text-align:left;">Item</th>
              <th style="padding:8px 10px;text-align:center;">Qty</th>
              <th style="padding:8px 10px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>

        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;color:#374151;">Total Amount Paid:</span>
          <span style="font-size:18px;font-weight:800;color:#A4860E;">₦${order.totalAmount.toLocaleString()}</span>
        </div>

        ${
          siteUrl
            ? `<div style="text-align:center;margin-top:28px;">
                <a href="${siteUrl}/dashboard/buyer/orders" style="background:#A4860E;color:#ffffff;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;display:inline-block;">View My Orders</a>
               </div>`
            : ""
        }
      </div>

      <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="font-size:11px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} CampusGo · Automated notification</p>
      </div>
    </div>
  `;

  function buildSellerHtml(items: any[]) {
    const sellerItemRows = items
      .map(
        (i) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #f3f4f6;">
            <strong style="color:#111827;">${i.title}</strong>
            ${i.selectedSize ? `<br/><span style="font-size:12px;color:#6b7280;">Size: ${i.selectedSize}</span>` : ""}
            ${i.selectedColor ? `<span style="font-size:12px;color:#6b7280;"> | Color: ${i.selectedColor}</span>` : ""}
          </td>
          <td style="padding:10px;border-bottom:1px solid #f3f4f6;text-align:center;">${i.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">₦${(i.price * i.quantity).toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    return `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:#A4860E;padding:28px 32px;text-align:center;">
          <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:800;">🎉 New Order Received!</h1>
          <p style="color:#fdf8e8;margin:6px 0 0;font-size:14px;">You have a new buyer on CampusGo</p>
        </div>

        <div style="padding:32px;">
          <p style="font-size:15px;color:#374151;margin:0 0 16px;">Hello,</p>
          <p style="font-size:14px;color:#4b5563;margin:0 0 24px;line-height:1.6;">
            Great news! A buyer has placed an order for item(s) in your store. Order reference: <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong>.
          </p>

          <h3 style="font-size:15px;font-weight:700;color:#111827;margin:0 0 12px;">Ordered Items</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
            <thead>
              <tr style="background:#f9fafb;color:#6b7280;font-size:12px;text-transform:uppercase;">
                <th style="padding:8px 10px;text-align:left;">Item</th>
                <th style="padding:8px 10px;text-align:center;">Qty</th>
                <th style="padding:8px 10px;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${sellerItemRows}
            </tbody>
          </table>

          <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="font-size:13px;font-weight:700;color:#166534;margin:0 0 6px;">🔐 Delivery PIN Required</p>
            <p style="font-size:13px;color:#8a6f0b;margin:0;">
              After delivering the order, ask the buyer for their 6-digit <strong>Delivery PIN</strong> and enter it in your seller dashboard to confirm delivery and trigger your payout.
            </p>
          </div>

          ${
            siteUrl
              ? `<p style="font-size:13px;color:#6b7280;text-align:center;">Head to your <a href="${siteUrl}/dashboard/seller/orders" style="color:#A4860E;font-weight:600;text-decoration:none;">Seller Dashboard</a> to manage this order.</p>`
              : ""
          }
        </div>

        <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="font-size:11px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} CampusGo · Automated notification</p>
        </div>
      </div>
    `;
  }

  if (hasSMTP && transporter) {
    try {
      // Send to buyer
      if (buyerEmail) {
        try {
          const info = await transporter.sendMail({
            from: smtpFrom,
            to: buyerEmail.trim(),
            subject: "Order Confirmation & Delivery PIN - CampusGo",
            html: buyerHtml,
          });
          console.log(`[EMAIL SUCCESS] Order confirmation sent to buyer (${buyerEmail}). MessageID: ${info.messageId}`);
        } catch (buyerErr) {
          console.error(`[EMAIL ERROR] Failed sending buyer confirmation to ${buyerEmail}:`, buyerErr);
        }
      }

      // Send personalized email to each seller
      for (const [email, items] of sellerItemsMap) {
        if (email) {
          try {
            const info = await transporter.sendMail({
              from: smtpFrom,
              to: email.trim(),
              subject: "🎉 New Order Received - CampusGo",
              html: buildSellerHtml(items),
            });
            console.log(`[EMAIL SUCCESS] New order alert sent to seller (${email}). MessageID: ${info.messageId}`);
          } catch (sellerErr) {
            console.error(`[EMAIL ERROR] Failed sending seller order alert to ${email}:`, sellerErr);
          }
        }
      }
    } catch (err) {
      console.error("[EMAIL ERROR] Transporter error sending order confirmation emails:", err);
    }
  } else {
    console.log(`[MOCK EMAIL] Order Confirmation to Buyer (${buyerEmail}). PIN: ${order.deliveryPin}`);
    for (const [email, items] of sellerItemsMap) {
      console.log(`[MOCK EMAIL] New Order Alert to Seller (${email}): ${items.map((i) => i.title).join(", ")}`);
    }
  }
}
