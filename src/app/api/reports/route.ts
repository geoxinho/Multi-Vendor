import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderReport } from "@/models/OrderReport";
import { auth } from "@/lib/auth";
import {
  findMutableOrderById,
  findOrdersAcrossCampuses,
  findUsersByIdsAcrossCampuses,
  populateOrdersWithUsersAndProducts,
  updateOrderAcrossCampuses,
} from "@/lib/campusModels";

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
    const school = searchParams.get("school");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (session.user.role === "admin") {
      if (orderId) query.order = orderId;
      if (status && status !== "all") query.status = status;
    } else {
      query.reportedBy = session.user.id;
      if (orderId) query.order = orderId;
    }

    const reports = await OrderReport.find(query)
      .sort({ createdAt: -1 })
      .lean();

    if (reports.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    // Collect reportedBy user IDs and order IDs to populate across campuses
    const reporterIds = [...new Set(reports.map((r: any) => r.reportedBy?.toString()).filter(Boolean))];
    const orderIds = [...new Set(reports.map((r: any) => r.order?.toString()).filter(Boolean))];

    const [usersMap, ordersList] = await Promise.all([
      findUsersByIdsAcrossCampuses(reporterIds),
      orderIds.length > 0 ? findOrdersAcrossCampuses({ _id: { $in: orderIds } }) : Promise.resolve([]),
    ]);

    const populatedOrders = await populateOrdersWithUsersAndProducts(ordersList);
    const ordersMap = new Map<string, any>();
    for (const o of populatedOrders) {
      ordersMap.set(o._id.toString(), o);
    }

    let mappedReports = reports.map((r: any) => {
      const repId = r.reportedBy?.toString();
      const ordId = r.order?.toString();
      const reportedBy = repId ? usersMap.get(repId) || { _id: repId } : null;
      const order = ordId ? ordersMap.get(ordId) || { _id: ordId } : null;

      return {
        ...r,
        reportedBy: reportedBy
          ? {
              _id: reportedBy._id.toString(),
              name: reportedBy.name || "Unknown",
              email: reportedBy.email || "",
              phone: reportedBy.phone || "",
              role: reportedBy.role || r.reporterRole,
              storeName: reportedBy.storeName || "",
              school: reportedBy.school || "",
            }
          : { _id: repId, name: "Unknown", email: "", role: r.reporterRole },
        order: order
          ? {
              _id: order._id.toString(),
              totalAmount: order.totalAmount || 0,
              paymentStatus: order.paymentStatus || "paid",
              deliveryStatus: order.deliveryStatus || "processing",
              deliveryPin: order.deliveryPin || "",
              payoutHeld: order.payoutHeld || false,
              payoutHoldReason: order.payoutHoldReason || "",
              buyer: order.buyer
                ? {
                    name: order.buyer.name || "Buyer",
                    email: order.buyer.email || "",
                    phone: order.buyer.phone || "",
                    school: order.buyer.school || "",
                  }
                : undefined,
              items: (order.items || []).map((i: any) => ({
                title: i.title || "Item",
                price: i.price || 0,
                quantity: i.quantity || 1,
              })),
            }
          : { _id: ordId, totalAmount: 0 },
      };
    });

    if (school && school !== "all") {
      mappedReports = mappedReports.filter(
        (r: any) => r.reportedBy?.school === school || r.order?.buyer?.school === school
      );
    }

    return NextResponse.json({ reports: mappedReports });
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

    const order = await findMutableOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const buyerId = order.buyer?._id ? order.buyer._id.toString() : order.buyer?.toString();
    const isBuyer = buyerId === userId;
    const isSeller = (order.items || []).some((item: any) => {
      const sId = item.seller?._id ? item.seller._id.toString() : item.seller?.toString();
      return sId === userId;
    });
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
      const reasonText = `Complaint lodged by buyer: ${reason} - ${subject.trim()}`;
      order.payoutHeld = true;
      order.payoutHoldReason = reasonText;
      await order.save();

      try {
        await updateOrderAcrossCampuses(orderId, {
          payoutHeld: true,
          payoutHoldReason: reasonText,
        });
      } catch {}
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
