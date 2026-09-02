import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { OrderReport } from "@/models/OrderReport";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (session.user.role === "admin") {
      if (orderId) query.order = orderId;
      if (status) query.status = status;
    } else {
      query.reportedBy = session.user.id;
      if (orderId) query.order = orderId;
    }

    const reports = await OrderReport.find(query)
      .populate("reportedBy", "name email phone role storeName school")
      .populate({
        path: "order",
        select: "totalAmount paymentStatus deliveryStatus deliveryPin items buyer createdAt payoutHeld payoutHoldReason",
        populate: { path: "buyer", select: "name email phone school" },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ reports });
  } catch (err) {
    console.error("[REPORTS GET]", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Sign in required" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason, subject, description, images } = body;

    if (!orderId || !reason || !subject || !description) {
      return NextResponse.json(
        { error: "Order ID, reason, subject, and description are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findById(orderId).populate("items.seller", "_id");
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const isBuyer = order.buyer.toString() === userId;
    const isSeller = order.items.some(
      (item: any) =>
        item.seller?._id?.toString() === userId || item.seller?.toString() === userId
    );
    const isAdmin = session.user.role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: "You can only report abnormalities on orders you are a party to." },
        { status: 403 }
      );
    }

    const reporterRole: "buyer" | "seller" = isBuyer ? "buyer" : "seller";

    const report = await OrderReport.create({
      order: order._id,
      reportedBy: userId,
      reporterRole,
      reason,
      subject: subject.trim(),
      description: description.trim(),
      images: Array.isArray(images) ? images : [],
      status: "pending",
    });

    // If buyer reports a serious issue, auto-flag payout hold to protect buyer escrow
    if (isBuyer && !order.sellerPaid) {
      order.payoutHeld = true;
      order.payoutHoldReason = `Complaint lodged by buyer: ${reason} - ${subject.trim()}`;
      await order.save();
    }

    return NextResponse.json(
      { message: "Complaint submitted successfully to administration", report },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REPORTS POST]", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
