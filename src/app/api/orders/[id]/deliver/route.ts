import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/email";
import {
  findMutableOrderById,
  findUsersByIdsAcrossCampuses,
  updateOrderAcrossCampuses,
} from "@/lib/campusModels";
import { findProductAcrossCampuses } from "@/lib/campusModels";
import { AdminUser } from "@/models/AdminUser";

type Params = { params: Promise<{ id: string }> };
type OrderItem = {
  seller?: {
    toString(): string;
    email?: string;
    name?: string;
    storeName?: string;
  };
  title?: string;
  product?: unknown;
};

// PATCH /api/orders/[id]/deliver — seller marks order as delivered via PIN
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role === "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const order = await findMutableOrderById(
      id,
      "name email",
      "name email storeName",
    );

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Seller can only mark if their products are in the order
    if (session.user.role === "seller") {
      const sellerIdsInOrder = (order.items || [])
        .map((item: any) =>
          item.seller?._id
            ? item.seller._id.toString()
            : item.seller?.toString(),
        )
        .filter(Boolean);

      // Fallback: if items don't include seller IDs, try resolving via products
      if (sellerIdsInOrder.length === 0) {
        // Try resolving sellers via product records but silently continue on failure
        try {
          const productIds = [
            ...new Set(
              (order.items || [])
                .map((it: any) =>
                  it.product?._id
                    ? it.product._id.toString()
                    : it.product?.toString(),
                )
                .filter(Boolean),
            ),
          ];

          const lookups = await Promise.all(
            productIds.map((pid: any) =>
              findProductAcrossCampuses(String(pid)).catch(() => null),
            ),
          );

          for (const res of lookups) {
            if (res && res.product) {
              const sellerId = res.product.seller?._id
                ? res.product.seller._id.toString()
                : res.product.seller?.toString();
              if (sellerId) sellerIdsInOrder.push(sellerId);
            }
          }
        } catch {
          /* ignore resolution errors */
        }
      }

      const hasSellersItems = sellerIdsInOrder.includes(session.user.id);
      if (!hasSellersItems) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (order.deliveryStatus === "delivered") {
      return NextResponse.json(
        { error: "Order has already been marked as delivered" },
        { status: 400 },
      );
    }

    const { pin } = await req.json();
    const normalizedPin = String(pin ?? "")
      .replace(/\s+/g, "")
      .trim();

    if (!/^\d{6}$/.test(normalizedPin)) {
      return NextResponse.json(
        { error: "Invalid PIN format. Must be a 6-digit number." },
        { status: 400 },
      );
    }

    if (
      String(order.deliveryPin ?? "")
        .replace(/\s+/g, "")
        .trim() !== normalizedPin
    ) {
      return NextResponse.json(
        {
          error:
            "Incorrect Delivery PIN. Please ask the buyer for the correct PIN.",
        },
        { status: 400 },
      );
    }

    const deliveredAt = new Date();
    const sellerPayoutReleaseAt = new Date(deliveredAt);
    sellerPayoutReleaseAt.setHours(sellerPayoutReleaseAt.getHours() + 24);
    const payoutDateStr = sellerPayoutReleaseAt.toLocaleString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    order.deliveryStatus = "delivered";
    order.deliveredAt = deliveredAt;
    order.sellerPayoutReleaseAt = sellerPayoutReleaseAt;
    await order.save();

    try {
      await updateOrderAcrossCampuses(id, {
        deliveryStatus: "delivered",
        deliveredAt,
        sellerPayoutReleaseAt,
      });
    } catch {}

    const orderId = (order._id as { toString(): string })
      .toString()
      .slice(-8)
      .toUpperCase();
    const productTitle = order.items[0]?.title || "your item";
    const buyer = order.buyer as any;
    const firstSeller = order.items[0]?.seller as any;
    const firstProductId = order.items[0]?.product?._id
      ? (order.items[0].product._id as { toString(): string }).toString()
      : ((order.items[0]?.product as { toString(): string })?.toString() ?? "");

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusgo.vercel.app";

    // ── Email to BUYER ──────────────────────────────────────────────
    const buyerHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#F5F8FF;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:40px 16px;">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.06);border:1px solid #BFDBFE30;">
            <div style="background:linear-gradient(135deg,#A4860E,#4F46E5);padding:36px 32px;text-align:center;">
              <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                <span style="color:#fff;font-size:24px;">🎉</span>
              </div>
              <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">Thank You! Delivery Confirmed</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;">Your order has been successfully delivered</p>
            </div>
            <div style="padding:32px;">
              <p style="color:#111111;font-size:15px;font-weight:600;margin:0 0 8px;">Hi ${buyer?.name || "there"} 👋</p>
              <p style="color:#6B6B6B;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Thank you so much for your purchase on <strong>CampusGo</strong>! We're thrilled to confirm that your order for <strong>"${productTitle}"</strong> has been successfully delivered. We hope you love your new item!
              </p>
              <div style="background:#F5F8FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="font-size:11px;font-weight:700;color:#9B9B9B;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Order Summary</p>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Order ID</td><td style="font-size:13px;font-weight:700;color:#111111;text-align:right;">#${orderId}</td></tr>
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Product</td><td style="font-size:13px;font-weight:700;color:#111111;text-align:right;">${productTitle}</td></tr>
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Total Paid</td><td style="font-size:13px;font-weight:700;color:#A4860E;text-align:right;">₦${order.totalAmount.toLocaleString()}</td></tr>
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Delivered</td><td style="font-size:13px;font-weight:700;color:#A4860E;text-align:right;">${deliveredAt.toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td></tr>
                </table>
              </div>
              <!-- Leave a Review CTA Box -->
              <div style="background:linear-gradient(135deg,#FFFBEB,#FFF7ED);border:1px solid #FFEDD5;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
                <p style="font-size:24px;margin:0 0 6px;">⭐</p>
                <p style="font-size:15px;font-weight:800;color:#9A3412;margin:0 0 6px;">How was your experience?</p>
                <p style="font-size:13px;color:#9A3412;margin:0 0 16px;line-height:1.5;">Please take 30 seconds to drop a review for this product! Your honest feedback helps fellow campus buyers make great decisions.</p>
                <a href="${SITE_URL}/products/${firstProductId}" style="display:inline-block;background:#D97706;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;box-shadow:0 2px 8px rgba(217,119,6,0.25);">⭐ Leave a Product Review →</a>
              </div>
              <p style="color:#9B9B9B;font-size:12px;text-align:center;margin:0;">Thank you for shopping on CampusGo 💙<br>Nigeria's safest campus marketplace.</p>
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
            <div style="background:linear-gradient(135deg,#A4860E,#A4860E);padding:36px 32px;text-align:center;">
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
                  <tr><td style="font-size:13px;color:#6B6B6B;padding:4px 0;">Delivery Confirmed</td><td style="font-size:13px;font-weight:700;color:#A4860E;text-align:right;">${deliveredAt.toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td></tr>
                </table>
              </div>
              <div style="background:linear-gradient(135deg,#fdf8e8,#DBEAFE);border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="font-size:13px;font-weight:700;color:#1E40AF;margin:0 0 8px;">🏦 When Will You Get Paid?</p>
                <p style="font-size:13px;color:#A4860E;line-height:1.6;margin:0 0 12px;">
                  Your payout is automatically released <strong>24 hours after delivery confirmation</strong>. This gives buyers just enough time to flag any issues while ensuring sellers are paid quickly.
                </p>
                <div style="background:#fff;border-radius:8px;padding:12px 16px;border:1px solid #BFDBFE;">
                  <p style="font-size:12px;color:#9B9B9B;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Auto-Release At</p>
                  <p style="font-size:15px;font-weight:800;color:#1E40AF;margin:0;">⏰ ${payoutDateStr}</p>
                </div>
                <p style="font-size:12px;color:#6B6B6B;margin:12px 0 0;">Once released, the funds will be transferred to your registered bank account. Keep your bank details up to date in your seller settings.</p>
              </div>
              <a href="${SITE_URL}/dashboard/seller" style="display:block;background:#A4860E;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;text-align:center;">View Your Dashboard →</a>
              <p style="color:#9B9B9B;font-size:12px;text-align:center;margin:16px 0 0;">Thank you for selling on CampusGo 💚<br>Keep listing great products to earn more!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const adminHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:40px 16px;">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);border:1px solid #E2E8F0;">
            <div style="background:linear-gradient(135deg,#0F172A,#334155);padding:36px 32px;text-align:center;">
              <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                <span style="color:#fff;font-size:24px;">📦</span>
              </div>
              <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">Delivery Confirmation Alert</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">An order was verified and marked as delivered</p>
            </div>
            <div style="padding:32px;">
              <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px;">
                Order <strong>#${orderId}</strong> has been confirmed delivered by the seller. The buyer and seller were notified automatically.
              </p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="font-size:13px;color:#475569;line-height:1.6;margin:0 0 6px;"><strong>Buyer:</strong> ${buyer?.name || "Unknown"}</p>
                <p style="font-size:13px;color:#475569;line-height:1.6;margin:0 0 6px;"><strong>Product:</strong> ${productTitle}</p>
                <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;"><strong>Delivery PIN:</strong> <span style="font-family:monospace;font-weight:800;letter-spacing:2px;">${String(order.deliveryPin || "").trim()}</span></p>
              </div>
              <a href="${SITE_URL}/dashboard/admin/orders" style="display:block;background:#0F172A;color:#ffffff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;text-align:center;">Open Admin Orders →</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const resolveRecipientEmail = async (
      userRef: any,
    ): Promise<string | null> => {
      if (!userRef) return null;

      // If it's a string, it might be an email OR an ObjectId string.
      if (typeof userRef === "string") {
        const s = userRef.trim();
        if (!s) return null;
        // Simple heuristic: treat as email only if it contains '@'
        if (s.includes("@")) return s;
        // Otherwise assume it's an id and fall through to DB lookup
        const userMap = await findUsersByIdsAcrossCampuses([s]);
        return userMap.get(s)?.email?.trim() || null;
      }

      if (typeof userRef === "object") {
        const direct =
          typeof userRef.email === "string" ? userRef.email.trim() : "";
        if (direct) return direct;

        const id = (userRef._id || userRef.id || userRef)?.toString();
        if (!id) return null;

        const userMap = await findUsersByIdsAcrossCampuses([id]);
        return userMap.get(id)?.email?.trim() || null;
      }

      return null;
    };

    let buyerEmail = await resolveRecipientEmail(order.buyer);
    let buyerName =
      (order.buyer && (order.buyer.name || order.buyer.storeName)) || null;

    // Fallback: if resolveRecipientEmail failed, try direct campus lookup by buyer id
    if (!buyerEmail) {
      try {
        const buyerId = (order.buyer?._id || order.buyer)?.toString();
        if (buyerId) {
          const userMap = await findUsersByIdsAcrossCampuses([buyerId]);
          const u = userMap.get(buyerId) || userMap.get(String(buyerId));
          if (u && u.email) buyerEmail = u.email.trim();
          if (!buyerName && u && (u.name || u.storeName))
            buyerName = u.name || u.storeName;
        }
      } catch {
        // ignore
      }
    }
    // Build seller IDs from embedded data or fallback to product lookups
    let sellerIds = [
      ...new Set(
        (order.items || [])
          .map((item: any) =>
            item.seller?._id
              ? item.seller._id.toString()
              : item.seller?.toString(),
          )
          .filter(Boolean),
      ),
    ] as string[];

    if (sellerIds.length === 0) {
      try {
        const productIds = [
          ...new Set(
            (order.items || [])
              .map((it: any) =>
                it.product?._id
                  ? it.product._id.toString()
                  : it.product?.toString(),
              )
              .filter(Boolean),
          ),
        ];

        const lookups = await Promise.all(
          productIds.map((pid: any) =>
            findProductAcrossCampuses(String(pid)).catch(() => null),
          ),
        );
        for (const res of lookups) {
          if (res && res.product) {
            const sId = res.product.seller?._id
              ? res.product.seller._id.toString()
              : res.product.seller?.toString();
            if (sId) sellerIds.push(sId);
          }
        }
        sellerIds = [...new Set(sellerIds)];
      } catch (e) {
        console.warn("[DELIVER] seller id resolution via products failed:", e);
      }
    }

    // Fetch seller emails in batch
    let sellerEmailList: (string | null)[] = [];
    if (sellerIds.length > 0) {
      const sellersMap = await findUsersByIdsAcrossCampuses(sellerIds);
      sellerEmailList = sellerIds.map(
        (sid) => sellersMap.get(sid)?.email?.trim() || null,
      );
    }

    const adminEmails = await AdminUser.find({ isBanned: { $ne: true } })
      .select("email")
      .lean()
      .then((users: any[]) => users.map((u) => u.email).filter(Boolean))
      .catch(() => [] as string[]);

    const finalAdminEmails = new Set<string>(
      [
        ...adminEmails,
        ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
        ...(process.env.SMTP_USER ? [process.env.SMTP_USER] : []),
      ]
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );

    const sendToUniqueEmails = async (
      receivers: string[],
      subject: string,
      html: string,
    ) => {
      const unique = [
        ...new Set(
          receivers.filter(Boolean).map((receiver) => receiver.trim()),
        ),
      ];
      for (const receiver of unique) {
        try {
          await sendMail({ to: receiver, subject, html });
          console.log(`[EMAIL SUCCESS] Delivery mail sent to ${receiver}.`);
        } catch (error) {
          console.error(
            `[EMAIL ERROR] Failed delivering mail to ${receiver}:`,
            error,
          );
        }
      }
    };

    const uniqueSellerEmails = sellerEmailList.filter(
      (email): email is string => Boolean(email),
    );
    const buyerRecipients = buyerEmail ? [buyerEmail] : [];
    const adminRecipients = [...finalAdminEmails];

    await sendToUniqueEmails(
      buyerRecipients,
      `🎉 Delivery Confirmed — Thank you for your purchase! | Order #${orderId}`,
      buyerHtml,
    );
    if (uniqueSellerEmails.length > 0) {
      await sendToUniqueEmails(
        uniqueSellerEmails,
        `💰 Sale Confirmed — Your product has been delivered! | Order #${orderId}`,
        sellerHtml,
      );
    }
    if (adminRecipients.length > 0) {
      await sendToUniqueEmails(
        adminRecipients,
        `📦 [Admin] Delivery Confirmed for Order #${orderId}`,
        adminHtml,
      );
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
