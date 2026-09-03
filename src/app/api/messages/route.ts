import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await connectDB();

    // Ensure user is part of the order
    const order = await Order.findById(orderId).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const isBuyer = order.buyer.toString() === session.user.id;
    // @ts-ignore
    const isSeller = order.items.some((item: any) => item.seller.toString() === session.user.id);

    if (!isBuyer && !isSeller && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark messages as read where current user is receiver
    await Message.updateMany(
      { order: orderId, receiver: session.user.id, read: false },
      { $set: { read: true } }
    );

    const messages = await Message.find({ order: orderId })
      .populate("sender", "name avatar passport role")
      .sort("createdAt")
      .lean();

    const mappedMessages = messages.map((m: any) => {
      const sender = m.sender || {};
      const isSeller = sender.role === "seller";
      return {
        ...m,
        sender: {
          ...sender,
          avatar: isSeller ? (sender.passport || sender.avatar || "") : "",
        },
      };
    });

    return NextResponse.json(mappedMessages);
  } catch (err) {
    console.error("[MESSAGES GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { orderId, text, receiverId } = body;

    if (!orderId || !text || !receiverId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const isBuyer = order.buyer.toString() === session.user.id;
    // @ts-ignore
    const isSeller = order.items.some((item: any) => item.seller.toString() === session.user.id);

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await Message.create({
      order: orderId,
      sender: session.user.id,
      receiver: receiverId,
      text,
    });

    const populated = await Message.findById(message._id).populate("sender", "name avatar role").lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    console.error("[MESSAGES POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
