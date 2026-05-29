import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };
type OrderItem = { seller?: { toString(): string } };

// PATCH /api/orders/[id]/ship — seller marks order as shipped
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role === "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Seller can only mark if their products are in the order
    if (session.user.role === "seller") {
      const hasSellersItems = order.items.some(
        (item: OrderItem) => item.seller?.toString() === session.user.id
      );
      if (!hasSellersItems) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (order.deliveryStatus !== "processing") {
      return NextResponse.json(
        { error: "Order can only be marked as shipped when in processing state" },
        { status: 400 }
      );
    }

    order.deliveryStatus = "shipped";
    await order.save();

    return NextResponse.json({ message: "Order marked as shipped", order });
  } catch (err) {
    console.error("[ORDER SHIP]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
