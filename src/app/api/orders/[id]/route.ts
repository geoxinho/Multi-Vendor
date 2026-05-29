import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
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

    const isBuyer = order.buyer._id.toString() === session.user.id;
    const isSeller = order.items.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => item.seller?.toString() === session.user.id
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
