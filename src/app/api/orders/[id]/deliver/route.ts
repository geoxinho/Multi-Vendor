import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };
type OrderItem = { seller?: { toString(): string } };

// PATCH /api/orders/[id]/deliver — seller marks order as delivered
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role === "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id);
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

    order.deliveryStatus = "delivered";
    order.deliveredAt = deliveredAt;
    order.sellerPayoutReleaseAt = sellerPayoutReleaseAt;
    await order.save();

    return NextResponse.json({ message: "Order marked as delivered", order });
  } catch (err) {
    console.error("[ORDER DELIVER]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
