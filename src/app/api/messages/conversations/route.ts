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
      // Find orders where current user is either the seller or the buyer
      orders = await Order.find({
        $or: [
          { "items.seller": userId },
          { buyer: userId }
        ]
      })
        .populate("buyer", "name avatar")
        .populate("items.seller", "name avatar")
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

        // Determine the other party and type
        let otherParty = null;
        let convType: "buy" | "sell" = "sell";

        if (order.buyer?._id?.toString() === userId) {
          // Current user is the buyer -> other party is the seller
          otherParty = order.items[0]?.seller;
          convType = "buy";
        } else {
          // Current user is the seller -> other party is the buyer
          otherParty = order.buyer;
          convType = "sell";
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
          type: convType,
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
