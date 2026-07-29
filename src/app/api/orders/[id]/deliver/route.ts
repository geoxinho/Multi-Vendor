import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };
type OrderItem = { seller?: { toString(): string; email?: string; name?: string; storeName?: string }; title?: string; product?: unknown };

// PATCH /api/orders/[id]/deliver — seller marks order as delivered via PIN
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role === "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id)
      .populate("buyer", "name email")
      .populate("items.seller", "name email storeName");

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Seller can only mark if their products are in the order
    if (session.user.role === "seller") {
      const hasSellersItems = order.items.some(
        (item: OrderItem) => item.seller?.toString() === session.user.id,
      );
      if (!hasSellersItems) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (order.deliveryStatus === "delivered") {
      return NextResponse.json(
        { error: "Order has already been marked as delivered" },
        { status: 400 }
      );
    }

    const { pin } = await req.json();
    if (!pin || typeof pin !== "string" || pin.length !== 6) {
      return NextResponse.json(
        { error: "Invalid PIN format. Must be a 6-digit number." },
        { status: 400 }
      );
    }

    if (order.deliveryPin !== pin) {
      return NextResponse.json(
        { error: "Incorrect Delivery PIN. Please ask the buyer for the correct PIN." },
        { status: 400 }
      );
    }

    const deliveredAt = new Date();
    const sellerPayoutReleaseAt = new Date(deliveredAt);
    sellerPayoutReleaseAt.setDate(sellerPayoutReleaseAt.getDate() + 3);
    const payoutDateStr = sellerPayoutReleaseAt.toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    order.deliveryStatus = "delivered";
    order.deliveredAt = deliveredAt;
    order.sellerPayoutReleaseAt = sellerPayoutReleaseAt;
    await order.save();

    const orderId = (order._id as { toString(): string }).toString().slice(-8).toUpperCase();
    const productTitle = order.items[0]?.title || "your item";
    const buyer = order.buyer as any;
    const firstSeller = order.items[0]?.seller as any;

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://closevenders.vercel.app";

    // ── Email to BUYER ──────────────────────────────────────────────
    const buyerHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#F5F8FF;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:40px 16px;">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.06);border:1px solid #BFDBFE30;">
            <div style="background:linear-gradient(135deg,#2563EB,#4F46E5);padding:36px 32px;text-align:center;">
              <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                <span style="color:#fff;font-size:24px;">🎉</span>
              </div>
              <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">Delivery Confirmed!</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;">Your item has been successfully delivered</p>
            </div>
            <div style="padding:32px;">
              <p style="color:#111111;font-size:15px;font-weight:600;margin:0 0 8px;">Hi ${buyer?.name || "there"} 👋</p>
              <p style="color:#6B6B6B;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Thank you so much for your purchase on <strong>MarketHub</strong>! We're thrilled to let you know that your order has been successfully delivered. We hope everything arrived in perfect condition!
              </p>
              <div style="background:#F5F8FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="font-size:11px;font-weight:700;color:#9B9B9B;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Order Summary</p>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Order ID</td><td style="font-size:13px;font-weight:700;color:#111111;text-align:right;">#${orderId}</td></tr>
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Product</td><td style="font-size:13px;font-weight:700;color:#111111;text-align:right;">${productTitle}</td></tr>
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Total Paid</td><td style="font-size:13px;font-weight:700;color:#2563EB;text-align:right;">₦${order.totalAmount.toLocaleString()}</td></tr>
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Delivered</td><td style="font-size:13px;font-weight:700;color:#16A34A;text-align:right;">${deliveredAt.toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td></tr>
                </table>
              </div>
              <div style="background:linear-gradient(135deg,#FFFBEB,#FFF7ED);border:1px solid #FFEDD5;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
                <p style="font-size:20px;margin:0 0 6px;">⭐</p>
                <p style="font-size:14px;font-weight:700;color:#9A3412;margin:0 0 6px;">How was your experience?</p>
                <p style="font-size:13px;color:#9A3412;margin:0 0 14px;">Your feedback helps other students make better buying decisions. It only takes 30 seconds!</p>
                <a href="${SITE_URL}/products/${order.items[0]?.product?.toString() ?? ""}" style="display:inline-block;background:#D97706;color:#fff;font-size:13px;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;">Leave a Review →</a>
              </div>
              <p style="color:#9B9B9B;font-size:12px;text-align:center;margin:0;">Thank you for shopping on MarketHub 💙<br>Nigeria's safest campus marketplace.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // ── Email to SELLER ─────────────────────────────────────────────
    const sellerHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#F0FDF4;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:40px 16px;">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(22,163,74,0.06);border:1px solid #BBF7D030;">
            <div style="background:linear-gradient(135deg,#16A34A,#059669);padding:36px 32px;text-align:center;">
              <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                <span style="color:#fff;font-size:24px;">💰</span>
              </div>
              <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">Sale Completed!</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;">Your product has been successfully delivered</p>
            </div>
            <div style="padding:32px;">
              <p style="color:#111111;font-size:15px;font-weight:600;margin:0 0 8px;">Hi ${firstSeller?.storeName || firstSeller?.name || "there"} 👋</p>
              <p style="color:#6B6B6B;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Great news! Your product has been <strong>successfully sold and delivered</strong> to the buyer. The delivery has been confirmed, and your payout will be processed shortly.
              </p>
              <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="font-size:11px;font-weight:700;color:#9B9B9B;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Sale Summary</p>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Order ID</td><td style="font-size:13px;font-weight:700;color:#111111;text-align:right;">#${orderId}</td></tr>
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Product Sold</td><td style="font-size:13px;font-weight:700;color:#111111;text-align:right;">${productTitle}</td></tr>
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Delivery Confirmed</td><td style="font-size:13px;font-weight:700;color:#16A34A;text-align:right;">${deliveredAt.toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td></tr>
                </table>
              </div>
              <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="font-size:13px;font-weight:700;color:#1E40AF;margin:0 0 8px;">🏦 When Will You Get Paid?</p>
                <p style="font-size:13px;color:#2563EB;line-height:1.6;margin:0 0 12px;">
                  Your payout is held for a <strong>3-day buyer protection period</strong> after delivery confirmation. This helps ensure both buyers and sellers are protected.
                </p>
                <div style="background:#fff;border-radius:8px;padding:12px 16px;border:1px solid #BFDBFE;">
                  <p style="font-size:12px;color:#9B9B9B;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Expected Payout Date</p>
                  <p style="font-size:15px;font-weight:800;color:#1E40AF;margin:0;">📅 ${payoutDateStr}</p>
                </div>
                <p style="font-size:12px;color:#6B6B6B;margin:12px 0 0;">Once released, the funds will be transferred to your registered bank account. Keep your bank details up to date in your seller settings.</p>
              </div>
              <a href="${SITE_URL}/dashboard/seller" style="display:block;background:#16A34A;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;text-align:center;">View Your Dashboard →</a>
              <p style="color:#9B9B9B;font-size:12px;text-align:center;margin:16px 0 0;">Thank you for selling on MarketHub 💚<br>Keep listing great products to earn more!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails (fire and forget)
    const hasSMTP = process.env.SMTP_USER && process.env.SMTP_PASS;
    if (hasSMTP) {
      const emailPromises: Promise<void>[] = [];

      if (buyer?.email) {
        emailPromises.push(
          sendMail({
            to: buyer.email,
            subject: `🎉 Delivery Confirmed — Thank you for your purchase! | Order #${orderId}`,
            html: buyerHtml,
          }).catch((e) => console.error("[EMAIL BUYER DELIVERY]", e))
        );
      }

      const sellersSeen = new Set<string>();
      for (const item of order.items) {
        const seller = item.seller as any;
        if (seller?.email && !sellersSeen.has(seller.email)) {
          sellersSeen.add(seller.email);
          emailPromises.push(
            sendMail({
              to: seller.email,
              subject: `💰 Sale Confirmed — Your product has been delivered! | Order #${orderId}`,
              html: sellerHtml,
            }).catch((e) => console.error("[EMAIL SELLER DELIVERY]", e))
          );
        }
      }

      await Promise.allSettled(emailPromises);
    }

    return NextResponse.json({ message: "Order marked as delivered", order });
  } catch (err) {
    console.error("[ORDER DELIVER]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
