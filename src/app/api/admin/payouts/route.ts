import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/email";

// GET /api/admin/payouts — list orders eligible or pending payout
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "pending"; // pending | held | paid | all
    const school = searchParams.get("school") ?? "";

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = { deliveryStatus: "delivered", paymentStatus: "paid" };

    if (filter === "pending") {
      // Delivered, not yet paid, not held — auto-release window active or passed
      query = { ...query, sellerPaid: false, payoutHeld: { $ne: true } };
    } else if (filter === "held") {
      query = { ...query, sellerPaid: false, payoutHeld: true };
    } else if (filter === "paid") {
      query = { ...query, sellerPaid: true };
    }
    // "all" keeps base query

    if (school && school !== "all") {
      const usersInSchool = await User.find({ school }).distinct("_id");
      query.$or = [
        { buyer: { $in: usersInSchool } },
        { "items.seller": { $in: usersInSchool } },
      ];
    }

    const orders = await Order.find(query)
      .populate("buyer", "name email school")
      .populate("items.seller", "name email storeName school")
      .sort("-deliveredAt")
      .lean();

    return NextResponse.json(orders);
  } catch (err) {
    console.error("[ADMIN PAYOUTS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/payouts
 * Body: { orderId: string, action: "hold" | "release_hold", reason?: string }
 *
 * "hold"         — blocks cron from releasing payout; emails seller about the hold
 * "release_hold" — clears the hold; cron will process on next run
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, action, reason } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    if (!action || !["hold", "release_hold"].includes(action)) {
      return NextResponse.json({ error: 'action must be "hold" or "release_hold"' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.sellerPaid) return NextResponse.json({ error: "Payout already released" }, { status: 409 });

    if (action === "hold") {
      order.payoutHeld = true;
      order.payoutHoldReason = reason?.trim() || "Your payout is under review by the admin team.";
      await order.save();

      // Find seller(s) and notify them
      const sellerIds = [...new Set(order.items.map((i: { seller: { toString(): string } }) => i.seller.toString()))];
      for (const sellerId of sellerIds) {
        const seller = await User.findById(sellerId).select("name storeName email");
        if (!seller?.email) continue;

        try {
          await sendMail({
            to: seller.email,
            subject: "⚠️ Payout Temporarily Held – CampusGo",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
                <div style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:28px 32px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">⚠️ Payout on Hold</h1>
                  <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Action required — please read carefully</p>
                </div>
                <div style="padding:28px 32px;">
                  <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi <strong>${seller.storeName || seller.name}</strong>,</p>
                  <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">
                    We wanted to inform you that the payout for order
                    <strong>#${order._id.toString().slice(-12).toUpperCase()}</strong> has been
                    <strong style="color:#d97706;">temporarily placed on hold</strong> by our admin team.
                  </p>
                  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:18px 22px;margin:0 0 22px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">Reason for Hold</p>
                    <p style="margin:0;color:#111827;font-size:14px;line-height:1.5;">${order.payoutHoldReason}</p>
                  </div>
                  <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 22px;">
                    Our team is reviewing the transaction between you and the buyer. This is a routine security measure to ensure both parties are protected. 
                    Once the review is complete, your payout will be released automatically — you do not need to take any action.
                  </p>
                  <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 22px;">
                    If you have any questions or concerns, please contact us through the CampusGo support channel.
                  </p>
                  <div style="text-align:center;margin-top:8px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://campusgo.vercel.app"}/dashboard/seller/payouts"
                      style="display:inline-block;background:#d97706;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                      View My Payouts
                    </a>
                  </div>
                </div>
                <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">CampusGo · Adeleke University Campus Marketplace</p>
                </div>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error(`[HOLD EMAIL ERROR] Failed to email seller ${sellerId}:`, emailErr);
        }
      }

      return NextResponse.json({ message: "Payout held and seller notified", order });
    }

    // action === "release_hold"
    order.payoutHeld = false;
    order.payoutHoldReason = "";
    await order.save();

    return NextResponse.json({ message: "Hold released — payout will be processed on next cron run", order });
  } catch (err) {
    console.error("[ADMIN PAYOUTS PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
