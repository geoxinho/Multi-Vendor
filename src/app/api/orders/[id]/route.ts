import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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
    const db = (mongoose as any).connection.db;

    // Try global Order collection first
    let orderRaw: any = null;
    try {
      const found = await Order.findById(id).lean();
      if (found) orderRaw = found;
    } catch {}

    // If not found globally, search campus collections
    if (!orderRaw && db) {
      const allCols: { name: string }[] = await db.listCollections().toArray();
      const orderColNames = allCols
        .map((c) => c.name)
        .filter((n) => n.endsWith("_orders") || n === "orders");

      let objectId: mongoose.Types.ObjectId | null = null;
      try { objectId = new mongoose.Types.ObjectId(id); } catch {}

      for (const colName of orderColNames) {
        try {
          const col = db.collection(colName);
          const filterQ: any = objectId
            ? { $or: [{ _id: objectId }, { _id: id }] }
            : { _id: id };
          const found = await col.findOne(filterQ);
          if (found) { orderRaw = found; break; }
        } catch {}
      }
    }

    if (!orderRaw) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Populate buyer and seller from campus user collections
    const allUserIds = new Set<string>();
    const allProductIds = new Set<string>();
    if (orderRaw.buyer) allUserIds.add(orderRaw.buyer.toString());
    for (const item of orderRaw.items || []) {
      if (item.seller) allUserIds.add(item.seller.toString());
      if (item.product) allProductIds.add(item.product.toString());
    }

    const userMap = new Map<string, any>();
    const productMap = new Map<string, any>();

    if (allUserIds.size > 0 && db) {
      const userIdArray = Array.from(allUserIds);
      const objectIds = userIdArray
        .filter((uid) => mongoose.Types.ObjectId.isValid(uid))
        .map((uid) => new mongoose.Types.ObjectId(uid));

      const allCols: { name: string }[] = await db.listCollections().toArray();
      const userColNames = allCols
        .map((c) => c.name)
        .filter((n) => n.endsWith("_users") || n === "users" || n === "admins");

      await Promise.all(
        userColNames.map(async (colName) => {
          try {
            const col = db.collection(colName);
            const filterQ: any = objectIds.length > 0
              ? { $or: [{ _id: { $in: objectIds } }, { _id: { $in: userIdArray } }] }
              : { _id: { $in: userIdArray } };
            const found = await col.find(filterQ)
              .project({ name: 1, storeName: 1, email: 1, phone: 1, school: 1, bankDetails: 1 })
              .toArray();
            for (const u of found) {
              userMap.set(u._id.toString(), {
                _id: u._id.toString(), name: u.name, storeName: u.storeName,
                email: u.email, phone: u.phone, school: u.school, bankDetails: u.bankDetails,
              });
            }
          } catch {}
        })
      );
    }

    if (allProductIds.size > 0 && db) {
      const productIdArray = Array.from(allProductIds);
      const productObjectIds = productIdArray
        .filter((pid) => mongoose.Types.ObjectId.isValid(pid))
        .map((pid) => new mongoose.Types.ObjectId(pid));

      const allCols: { name: string }[] = await db.listCollections().toArray();
      const productColNames = allCols
        .map((c) => c.name)
        .filter((n) => n.endsWith("_products") || n === "products");

      await Promise.all(
        productColNames.map(async (colName) => {
          try {
            const col = db.collection(colName);
            const filterQ: any = productObjectIds.length > 0
              ? { $or: [{ _id: { $in: productObjectIds } }, { _id: { $in: productIdArray } }] }
              : { _id: { $in: productIdArray } };
            const found = await col.find(filterQ).project({ title: 1, images: 1, price: 1 }).toArray();
            for (const p of found) {
              productMap.set(p._id.toString(), { _id: p._id.toString(), title: p.title, images: p.images, price: p.price });
            }
          } catch {}
        })
      );
    }

    const buyerId = orderRaw.buyer?.toString();
    const buyer = buyerId ? userMap.get(buyerId) || { _id: buyerId } : null;
    const items = (orderRaw.items || []).map((item: any) => ({
      ...item,
      seller: item.seller ? userMap.get(item.seller.toString()) || { _id: item.seller.toString() } : item.seller,
      product: item.product ? productMap.get(item.product.toString()) || { _id: item.product.toString() } : item.product,
    }));

    const order = { ...orderRaw, _id: orderRaw._id.toString(), buyer, items };

    // Authorization check
    const isBuyer = buyerId === session.user.id;
    const isSeller = (order.items || []).some((item: any) => {
      const sId = item.seller?._id || item.seller?.toString?.() || "";
      return sId === session.user.id;
    });
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

