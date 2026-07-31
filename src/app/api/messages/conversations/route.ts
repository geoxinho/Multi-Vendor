import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";
import { Types } from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || session.user.role; // buyer or seller

    let orders;
    if (role === "seller") {
      orders = await Order.find({ "items.seller": userId })
        .populate("buyer", "name avatar")
        .populate("items.product", "title images")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      orders = await Order.find({ buyer: userId })
        .populate("items.seller", "name avatar")
        .populate("items.product", "title images")
        .sort({ createdAt: -1 })
        .lean();
    }

    // Enhance orders with latest message info
    const conversations = await Promise.all(
      orders.map(async (order: any) => {
        const latestMessage = await Message.findOne({ order: order._id })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await Message.countDocuments({
          order: order._id,
          receiver: userId,
          read: false,
        });

        // Determine the other party
        let otherParty = null;
        if (role === "seller") {
          otherParty = order.buyer;
        } else {
          // If buyer, other party is the seller of the first item
          otherParty = order.items[0]?.seller;
        }

        return {
          orderId: order._id.toString(),
          orderTitle: order.items[0]?.title || "Order",
          orderImage: order.items[0]?.image,
          otherParty: {
            id: otherParty?._id?.toString(),
            name: otherParty?.name || "Unknown User",
            avatar: otherParty?.avatar,
          },
          latestMessage: latestMessage ? latestMessage.text : null,
          latestMessageAt: latestMessage ? latestMessage.createdAt : order.createdAt,
          unreadCount,
        };
      })
    );

    // Sort by latest message first
    conversations.sort((a, b) => new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime());

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
