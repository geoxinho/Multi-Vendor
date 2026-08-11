import nodemailer from "nodemailer";

/**
 * Sends a verification email to the user.
 * Falls back to printing a highly visible local verification link in the console 
 * if SMTP variables are not configured in the environment.
 */
export async function sendVerificationEmail(email: string, otp: string) {
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
        text: `Welcome to MarketHub! Your verification code is: ${otp}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="font-weight: 800; font-size: 24px; color: #111827;">Market<span style="color: #16a34a;">Hub</span></span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 12px; text-align: center;">Verify Your Email Address</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              Welcome to MarketHub! To complete your registration, please enter the 6-digit verification code below:
            </p>
            <div style="text-align: center; margin-bottom: 24px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #16a34a;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
              This code will expire in 24 hours.
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
  console.log(`OTP Code: ${otp}`);
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
 * sellerItemsMap: Map of seller email → their specific order items
 */
export async function sendOrderConfirmationEmails(
  order: Record<string, any>,
  buyerEmail: string,
  buyerName: string,
  sellerItemsMap: Map<string, Array<{
    title: string;
    image: string;
    price: number;
    quantity: number;
    platformFee: number;
    netPayout: number;
  }>>,
) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "MarketHub <no-reply@markethub.com>";

  const hasSMTP = smtpHost && smtpUser && smtpPass;

  // ── Buyer Email ───────────────────────────────────────────────────
  const buyerHtml = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);padding:28px 32px;text-align:center;">
          <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Market<span style="color:#bfdbfe;">Hub</span></span>
          <p style="color:#bfdbfe;font-size:13px;margin:6px 0 0;">Order Confirmation</p>
        </div>

        <div style="padding:28px 32px;">
          <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Thank you, ${buyerName}! 🎉</h2>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">Your payment was successful and your order is now being processed.</p>

          <!-- Delivery PIN Box -->
          <div style="background:#fef3c7;border:1.5px solid #f59e0b;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">⚠️ Your Delivery PIN — Keep This Secret</p>
            <p style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1f2937;margin:0 0 8px;">${order.deliveryPin}</p>
            <p style="font-size:12px;color:#b45309;margin:0;font-weight:500;">Only hand this PIN to the seller <strong>after</strong> they physically deliver your order. The seller needs it to confirm delivery and receive their payout.</p>
          </div>

          <!-- Order Summary -->
          <div style="background:#f9fafb;border-radius:10px;padding:18px;margin-bottom:20px;">
            <p style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 12px;">Order Summary</p>
            ${(order.items as any[]).map((item: any) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
              ${item.image ? `<img src="${item.image}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;" alt="${item.title}" />` : ""}
              <div style="flex:1;min-width:0;">
                <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</p>
                <p style="font-size:12px;color:#6b7280;margin:0;">Qty: ${item.quantity} × ₦${item.price.toLocaleString()}</p>
              </div>
              <p style="font-size:13px;font-weight:700;color:#111827;margin:0;white-space:nowrap;">₦${(item.price * item.quantity).toLocaleString()}</p>
            </div>`).join("")}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
              <p style="font-size:14px;font-weight:700;color:#111827;margin:0;">Total</p>
              <p style="font-size:16px;font-weight:900;color:#2563eb;margin:0;">₦${order.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <p style="font-size:13px;color:#6b7280;text-align:center;">You'll receive updates when your order ships. Happy shopping!</p>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="font-size:11px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} MarketHub · This is an automated email, please do not reply.</p>
        </div>
      </div>
    </div>
  `;

  // ── Per-Seller Email Builder ───────────────────────────────────────
  function buildSellerHtml(
    sellerItems: Array<{ title: string; image: string; price: number; quantity: number; platformFee: number; netPayout: number }>,
  ) {
    const sellerTotal = sellerItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const sellerNet = sellerItems.reduce((s, i) => s + i.netPayout, 0);
    const sellerFee = sellerItems.reduce((s, i) => s + i.platformFee, 0);

    const shipping = order.shippingAddress ?? {};

    return `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#059669 0%,#2563eb 100%);padding:28px 32px;text-align:center;">
            <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Market<span style="color:#a7f3d0;">Hub</span></span>
            <p style="color:#a7f3d0;font-size:13px;margin:6px 0 0;">New Order Received! 🎉</p>
          </div>

          <div style="padding:28px 32px;">
            <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">You have a new order!</h2>
            <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
              <strong>${buyerName}</strong> has just purchased ${sellerItems.length === 1 ? "an item" : "items"} from your store. Please prepare the order for delivery.
            </p>

            <!-- Items Ordered -->
            <div style="background:#f9fafb;border-radius:10px;padding:18px;margin-bottom:20px;">
              <p style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 12px;">Items Ordered</p>
              ${sellerItems.map((item) => `
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
                ${item.image ? `<img src="${item.image}" style="width:56px;height:56px;border-radius:8px;object-fit:cover;" alt="${item.title}" />` : ""}
                <div style="flex:1;min-width:0;">
                  <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</p>
                  <p style="font-size:12px;color:#6b7280;margin:0;">Qty: <strong>${item.quantity}</strong> &nbsp;·&nbsp; Unit price: <strong>₦${item.price.toLocaleString()}</strong></p>
                </div>
                <div style="text-align:right;white-space:nowrap;">
                  <p style="font-size:14px;font-weight:800;color:#111827;margin:0;">₦${(item.price * item.quantity).toLocaleString()}</p>
                  <p style="font-size:11px;color:#6b7280;margin:2px 0 0;">subtotal</p>
                </div>
              </div>`).join("")}

              <!-- Totals -->
              <div style="margin-top:8px;border-top:2px solid #e5e7eb;padding-top:12px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                  <p style="font-size:13px;color:#6b7280;margin:0;">Gross Sale</p>
                  <p style="font-size:13px;font-weight:600;color:#374151;margin:0;">₦${sellerTotal.toLocaleString()}</p>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                  <p style="font-size:13px;color:#dc2626;margin:0;">Platform Fee (5%)</p>
                  <p style="font-size:13px;font-weight:600;color:#dc2626;margin:0;">− ₦${sellerFee.toLocaleString()}</p>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
                  <p style="font-size:15px;font-weight:700;color:#111827;margin:0;">Your Net Payout</p>
                  <p style="font-size:17px;font-weight:900;color:#059669;margin:0;">₦${sellerNet.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <!-- Shipping Address -->
            <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:18px;margin-bottom:20px;">
              <p style="font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 10px;">📦 Delivery Address</p>
              <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 4px;">${shipping.fullName ?? buyerName}</p>
              <p style="font-size:13px;color:#374151;margin:0 0 2px;">${shipping.address ?? ""}</p>
              <p style="font-size:13px;color:#374151;margin:0 0 2px;">${[shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(", ")}</p>
              ${shipping.phone ? `<p style="font-size:13px;color:#374151;margin:6px 0 0;">📞 ${shipping.phone}</p>` : ""}
            </div>

            <!-- Delivery PIN reminder -->
            <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:16px;margin-bottom:20px;">
              <p style="font-size:13px;font-weight:700;color:#166534;margin:0 0 6px;">🔐 Delivery PIN Required</p>
              <p style="font-size:13px;color:#15803d;margin:0;">After delivering the order, ask the buyer for their 6-digit <strong>Delivery PIN</strong> and enter it in your seller dashboard to confirm delivery and start your payout countdown (<strong>3 days</strong> after confirmation).</p>
            </div>

            <p style="font-size:13px;color:#6b7280;text-align:center;">Head to your <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard/seller/orders" style="color:#2563eb;font-weight:600;text-decoration:none;">Seller Dashboard</a> to view and manage this order.</p>
          </div>

          <!-- Footer -->
          <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="font-size:11px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} MarketHub · This is an automated email, please do not reply.</p>
          </div>
        </div>
      </div>
    `;
  }

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

      // Send personalised email to each seller
      for (const [email, items] of sellerItemsMap) {
        if (email) {
          await transporter.sendMail({
            from: smtpFrom,
            to: email,
            subject: "🎉 New Order Received - MarketHub",
            html: buildSellerHtml(items),
          });
        }
      }
      console.log(`[EMAIL] Order emails sent for order ${order._id}`);
    } catch (err) {
      console.error("[EMAIL ERROR] Failed to send order emails:", err);
    }
  } else {
    console.log(`[MOCK EMAIL] Order Confirmation to Buyer (${buyerEmail}). PIN: ${order.deliveryPin}`);
    for (const [email, items] of sellerItemsMap) {
      console.log(`[MOCK EMAIL] New Order Alert to Seller (${email}): ${items.map((i) => i.title).join(", ")}`);
    }
  }
}

