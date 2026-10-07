import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { auth } from "@/lib/auth";
import { findOrderByIdAcrossCampuses, findUsersByIdsAcrossCampuses } from "@/lib/campusModels";

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

    // Ensure user is part of the order (check across all campus collections)
    const order = await findOrderByIdAcrossCampuses(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const buyerId = order.buyer?._id ? order.buyer._id.toString() : order.buyer?.toString();
    const isBuyer = buyerId === session.user.id;
    const isSeller = (order.items || []).some((item: any) => {
      const sId = item.seller?._id ? item.seller._id.toString() : item.seller?.toString();
      return sId === session.user.id;
    });

    if (!isBuyer && !isSeller && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark messages as read where current user is receiver
    await Message.updateMany(
      { order: orderId, receiver: session.user.id, read: false },
      { $set: { read: true } }
    );

    const messages = await Message.find({ order: orderId })
      .sort("createdAt")
      .lean();

    const senderIds = [...new Set(messages.map((m: any) => m.sender?.toString()).filter(Boolean))];
    const userMap = await findUsersByIdsAcrossCampuses(senderIds);

    const mappedMessages = messages.map((m: any) => {
      const sId = m.sender?.toString() || "";
      const user = userMap.get(sId);
      const isSellerSender = user?.role === "seller";
      return {
        ...m,
        sender: {
          _id: sId,
          name: user?.name || user?.storeName || (sId === session.user.id ? session.user.name : "User"),
          avatar: isSellerSender ? (user?.passport || user?.avatar || "") : (user?.avatar || ""),
          role: user?.role || "buyer",
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

    const order = await findOrderByIdAcrossCampuses(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const buyerId = order.buyer?._id ? order.buyer._id.toString() : order.buyer?.toString();
    const isBuyer = buyerId === session.user.id;
    const isSeller = (order.items || []).some((item: any) => {
      const sId = item.seller?._id ? item.seller._id.toString() : item.seller?.toString();
      return sId === session.user.id;
    });

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await Message.create({
      order: orderId,
      sender: session.user.id,
      receiver: receiverId,
      text,
    });

    const userMap = await findUsersByIdsAcrossCampuses([session.user.id]);
    const senderDoc = userMap.get(session.user.id);
    const role = senderDoc?.role || session.user.role || "buyer";
    const isSellerSender = role === "seller";
    const avatar = isSellerSender ? (senderDoc?.passport || senderDoc?.avatar || "") : (senderDoc?.avatar || "");

    const populated = {
      ...message.toObject(),
      sender: {
        _id: session.user.id,
        name: senderDoc?.name || senderDoc?.storeName || session.user.name || "User",
        avatar,
        role,
      },
    };

    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    console.error("[MESSAGES POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
