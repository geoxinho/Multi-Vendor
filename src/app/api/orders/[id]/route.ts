import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id)
      .populate("buyer", "name email")
      .populate("items.product", "title images")
      .lean();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const buyerId = order.buyer?._id ? order.buyer._id.toString() : order.buyer?.toString();
    const isBuyer = buyerId === session.user.id;
    const isSeller = order.items.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => {
        const sId = item.seller?._id ? item.seller._id.toString() : item.seller?.toString();
        return sId === session.user.id;
      }
    );
    const isAdmin = session.user.role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("[ORDER GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Admin-only: update delivery/payment status
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { deliveryStatus, paymentStatus } = body;

    const VALID_DELIVERY = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const VALID_PAYMENT = ["pending", "paid", "failed", "refunded"];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};
    if (deliveryStatus && VALID_DELIVERY.includes(deliveryStatus)) updates.deliveryStatus = deliveryStatus;
    if (paymentStatus && VALID_PAYMENT.includes(paymentStatus)) updates.paymentStatus = paymentStatus;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(id, updates, { new: true });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ message: "Order updated", order });
  } catch (err) {
    console.error("[ORDER PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

