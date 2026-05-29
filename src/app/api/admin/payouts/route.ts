import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

// GET /api/admin/payouts — list orders eligible or pending payout
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "eligible"; // eligible | paid | all

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = { deliveryStatus: "delivered", paymentStatus: "paid" };

    if (filter === "eligible") {
      query = { ...query, sellerPaid: false, sellerPayoutReleaseAt: { $lte: now } };
    } else if (filter === "paid") {
      query = { ...query, sellerPaid: true };
    }

    const orders = await Order.find(query)
      .populate("buyer", "name email")
      .populate("items.seller", "name email storeName")
      .sort("-deliveredAt")
      .lean();

    return NextResponse.json(orders);
  } catch (err) {
    console.error("[ADMIN PAYOUTS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/payouts — release payout for an order
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    await connectDB();
    const now = new Date();

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.sellerPaid) return NextResponse.json({ error: "Already paid out" }, { status: 409 });
    if (!order.sellerPayoutReleaseAt || order.sellerPayoutReleaseAt > now) {
      return NextResponse.json({ error: "Payout hold period not yet elapsed" }, { status: 400 });
    }

    order.sellerPaid = true;
    await order.save();

    return NextResponse.json({ message: "Payout released", order });
  } catch (err) {
    console.error("[ADMIN PAYOUTS PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
