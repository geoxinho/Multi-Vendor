import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { sendMail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    // Basic security for cron: require a secret token in the URL
    // e.g. /api/cron/payouts?token=MY_SECRET_CRON_TOKEN
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    await connectDB();

    // Find all orders that:
    // 1. Have been delivered
    // 2. Not yet paid to seller
    // 3. Their release date has passed (24 hrs)
    // 4. NOT held by admin
    const now = new Date();
    const ordersToProcess = await Order.find({
      deliveryStatus: "delivered",
      sellerPaid: false,
      payoutHeld: { $ne: true },
      sellerPayoutReleaseAt: { $lte: now },
    });

    if (ordersToProcess.length === 0) {
      return NextResponse.json({ message: "No payouts pending." });
    }

    const processedOrders = [];
    const failedOrders = [];

    for (const order of ordersToProcess) {
      try {
        // Group payouts by seller from order items
        const payoutsBySeller: Record<string, number> = {};
        for (const item of order.items) {
          const sellerId = item.seller.toString();
          if (!payoutsBySeller[sellerId]) {
            payoutsBySeller[sellerId] = 0;
          }
          payoutsBySeller[sellerId] += item.netPayout || 0;
        }

        let allSucceeded = true;

        // Process a transfer for each seller
        for (const [sellerId, amount] of Object.entries(payoutsBySeller)) {
          if (amount <= 0) continue;

          const seller = await User.findById(sellerId);
          if (!seller) {
            console.error(`[PAYOUT CRON] Seller ${sellerId} not found`);
            allSucceeded = false;
            continue;
          }

          const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

          if (!paystackSecret || paystackSecret.includes("xxx") || paystackSecret.trim() === "") {
            // Mock mode for dev/staging
            console.log(
              `[PAYOUT MOCK] Disbursed ₦${amount} to Seller ${seller.name} (${seller.bankDetails?.accountNumber ?? "no account"})`
            );
          } else {
            if (!seller.bankDetails || !seller.bankDetails.accountNumber) {
              console.error(`[PAYOUT CRON] Seller ${sellerId} has incomplete bank details`);
              allSucceeded = false;
              continue;
            }

            // Require a valid numeric bank code — bankName is NOT a valid Paystack bank_code
            const bankCode = seller.bankDetails.bankCode?.trim();
            if (!bankCode) {
              console.error(`[PAYOUT CRON] Seller ${sellerId} is missing bankCode — skipping. They must re-save bank details.`);
              allSucceeded = false;
              continue;
            }

            try {
              // 1. Create Transfer Recipient
              const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${paystackSecret}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  type: "nuban",
                  name: seller.bankDetails.accountName,
                  account_number: seller.bankDetails.accountNumber,
                  bank_code: bankCode,
                  currency: "NGN",
                }),
              });
              const recipientData = await recipientRes.json();

              if (!recipientData.status) {
                console.error(`[PAYOUT PAYSTACK ERROR] Recipient creation failed:`, recipientData.message);
                allSucceeded = false;
                continue;
              }

              const recipientCode = recipientData.data.recipient_code;

              // 2. Initiate Transfer
              const transferRes = await fetch("https://api.paystack.co/transfer", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${paystackSecret}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  source: "balance",
                  amount: Math.round(amount * 100), // Convert to kobo
                  recipient: recipientCode,
                  reason: `Payout for order ${order._id}`,
                }),
              });
              const transferData = await transferRes.json();

              if (!transferData.status) {
                console.error(`[PAYOUT PAYSTACK ERROR] Transfer failed:`, transferData.message);
                allSucceeded = false;
                continue;
              }

              console.log(`[PAYOUT SUCCESS] Disbursed ₦${amount} to Seller ${seller.name}`);
            } catch (payoutErr) {
              console.error(`[PAYOUT FAIL] Error paying seller ${sellerId}:`, payoutErr);
              allSucceeded = false;
              continue;
            }
          }

          // ── Send payout confirmation email to seller ──────────────────────
          try {
            const payoutDateStr = new Date().toLocaleString("en-NG", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            await sendMail({
              to: seller.email,
              subject: "💰 Payout Sent – CampusGo",
              html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
                  <div style="background:linear-gradient(135deg,#A4860E,#c9a72a);padding:28px 32px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">💰 Payout Disbursed!</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your earnings have been sent to your bank</p>
                  </div>
                  <div style="padding:28px 32px;">
                    <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hi <strong>${seller.storeName || seller.name}</strong>,</p>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Great news! Your payout for order <strong>#${order._id.toString().slice(-12).toUpperCase()}</strong> has been processed and disbursed to your bank account.
                    </p>
                    <div style="background:#fdf8e8;border:1px solid #e8d48a;border-radius:10px;padding:20px 24px;margin:0 0 24px;">
                      <p style="margin:0 0 6px;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Payout Summary</p>
                      <p style="margin:0 0 4px;color:#111827;font-size:26px;font-weight:800;">₦${Math.round(amount).toLocaleString()}</p>
                      <p style="margin:0;color:#6b7280;font-size:13px;">Disbursed on ${payoutDateStr}</p>
                      <p style="margin:6px 0 0;color:#6b7280;font-size:12px;">(5% platform fee already deducted — this is your net payout)</p>
                    </div>
                    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 24px;">
                      Bank Account: <strong>${seller.bankDetails?.accountName || seller.name} (${seller.bankDetails?.bankName || "Saved Bank"})</strong>
                    </p>
                    <div style="text-align:center;margin-top:8px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://campusgo.vercel.app"}/dashboard/seller/payouts"
                        style="display:inline-block;background:#A4860E;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                        View Payout History
                      </a>
                    </div>
                  </div>
                  <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">CampusGo · Adeleke University Campus Marketplace</p>
                  </div>
                </div>
              `,
            });
            console.log(`[PAYOUT EMAIL DISPATCHED] Email sent to seller ${seller.email}`);
          } catch (emailErr) {
            console.error(`[PAYOUT EMAIL ERROR] Failed to send payout email to seller ${sellerId}:`, emailErr);
          }
        }

        if (allSucceeded) {
          order.sellerPaid = true;
          await order.save();
          processedOrders.push(order._id);
        } else {
          failedOrders.push(order._id);
        }
      } catch (err) {
        console.error(`[PAYOUT CRON] Error processing order ${order._id}:`, err);
        failedOrders.push(order._id);
      }
    }

    return NextResponse.json({
      message: "Payouts processed",
      processed: processedOrders.length,
      failed: failedOrders.length,
    });
  } catch (err) {
    console.error("[PAYOUT CRON GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
