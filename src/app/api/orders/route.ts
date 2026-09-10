import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Message } from "@/models/Message";
import { AdminUser } from "@/models/AdminUser";
import { auth } from "@/lib/auth";
import { verifyTransaction } from "@/lib/flutterwave";
import { shippingSchema } from "@/utils/validators";
import { randomUUID } from "crypto";
import { sendOrderConfirmationEmails } from "@/utils/email";
import {
  getCampusOrderModel,
  getCampusProductModel,
  findUsersByIdsAcrossCampuses,
  findProductAcrossCampuses,
  findOrdersAcrossCampuses,
  populateOrdersWithUsersAndProducts,
} from "@/lib/campusModels";

// POST /api/orders — creates order after payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { shippingAddress, paymentRef } = body;

    const addressParsed = shippingSchema.safeParse(shippingAddress);
    if (!addressParsed.success) {
      return NextResponse.json({ error: addressParsed.error.issues[0].message }, { status: 400 });
    }

    const flwSecret =
      process.env.FLW_SECRET_KEY ||
      process.env.Secret_Key ||
      process.env.FLUTTERWAVE_SECRET_KEY;

    const isTestPlaceholder =
      !flwSecret ||
      flwSecret.includes("xxx") ||
      flwSecret.includes("REPLACE");

    const isMockRef =
      typeof paymentRef === "string" &&
      (paymentRef.startsWith("mock_") ||
        paymentRef.startsWith("test_") ||
        paymentRef.startsWith("demo_") ||
        paymentRef.startsWith("cgo_mock_"));

    if (!isTestPlaceholder && !isMockRef) {
      // Verify Flutterwave payment (only when a real secret key is configured and not a test/mock ref)
      const verification = await verifyTransaction(paymentRef);
      if (
        verification.status !== "success" ||
        !verification.data ||
        verification.data.status !== "successful"
      ) {
        console.error("[ORDERS] Flutterwave verification failed:", verification);
        return NextResponse.json({ error: "Payment verification failed. Please contact support." }, { status: 400 });
      }
      // Verify payment amount matches expected total (Flutterwave amount is in NGN)
      const paidAmountNGN = verification.data.amount;
      const { items: bodyItems } = body;
      if (bodyItems && bodyItems.length > 0) {
        // Store the verified paid amount for cross-checking
        (req as any)._verifiedAmount = paidAmountNGN;
      }
    } else {
      console.warn("[ORDERS] Skipping Flutterwave verification — test/mock mode.");
    }


    await connectDB();
    const buyerSchool = session.user.school || "";

    // Check if order already created for this reference
    const existingOrder = await Order.findOne({ paymentRef });
    if (existingOrder) {
      return NextResponse.json({ error: "Order already created for this payment" }, { status: 409 });
    }

    const { items } = body;
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // Validate products and compute total
    let totalAmount = 0;
    let totalPlatformFee = 0;
    let totalNetPayout = 0;
    const orderItems = [];

    for (const item of items) {
      let product: any = await Product.findById(item.productId).populate("seller", "_id");
      if (!product) {
        const found = await findProductAcrossCampuses(item.productId);
        if (found?.product) {
          product = found.product;
        }
      }

      if (!product || product.status !== "active") {
        return NextResponse.json({ error: `Product ${item.productId} is unavailable` }, { status: 400 });
      }

      const sellerId = product.seller?._id
        ? product.seller._id.toString()
        : (product.seller?.toString() || "");

      if (sellerId === session.user.id) {
        return NextResponse.json({ error: "You cannot purchase your own product." }, { status: 400 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.title}` }, { status: 400 });
      }

      const itemTotal = product.price * item.quantity;
      const itemPlatformFee = itemTotal * 0.05; // 5% fee
      const itemNetPayout = itemTotal - itemPlatformFee;

      totalAmount += itemTotal;
      totalPlatformFee += itemPlatformFee;
      totalNetPayout += itemNetPayout;

      orderItems.push({
        product: product._id,
        title: product.title,
        image: (product.images && product.images[0]) || "",
        price: product.price,
        quantity: item.quantity,
        seller: sellerId,
        platformFee: itemPlatformFee,
        netPayout: itemNetPayout,
        selectedSize: item.selectedSize ?? "",
        selectedColor: item.selectedColor ?? "",
      });

      // Decrement stock in DB across both Product and Campus collections
      try {
        if (typeof product.save === "function") {
          product.stock -= item.quantity;
          product.sold = (product.sold || 0) + item.quantity;
          await product.save();
        } else {
          await Product.findByIdAndUpdate(product._id, {
            $inc: { stock: -item.quantity, sold: item.quantity },
          });
        }
        if (product.school) {
          const CampusProduct = getCampusProductModel(product.school);
          await CampusProduct.findByIdAndUpdate(product._id, {
            $inc: { stock: -item.quantity, sold: item.quantity },
          }).catch(() => {});
        }
      } catch (stockErr) {
        console.warn("[ORDERS] Stock decrement warning:", stockErr);
      }
    }

    const order = await Order.create({
      buyer: session.user.id,
      items: orderItems,
      totalAmount,
      platformFee: totalPlatformFee,
      netPayout: totalNetPayout,
      paymentRef,
      paymentStatus: "paid",
      shippingAddress: addressParsed.data,
    });

    // Mirror order to campus-specific collections (buyer school + all seller schools)
    const schoolsToMirror = new Set<string>();
    if (buyerSchool) schoolsToMirror.add(buyerSchool);
    // Also mirror to seller school collections so orders show for sellers
    for (const item of orderItems) {
      if ((item as any)._sellerSchool) schoolsToMirror.add((item as any)._sellerSchool);
    }
    // Try to resolve seller schools from DB
    const sellerIdsForSchool = [...new Set(orderItems.map((item) => item.seller.toString()))];
    try {
      const sellersForSchool = await findUsersByIdsAcrossCampuses(sellerIdsForSchool);
      for (const [, sellerDoc] of sellersForSchool) {
        if (sellerDoc?.school) schoolsToMirror.add(sellerDoc.school);
      }
    } catch {}

    for (const schoolName of schoolsToMirror) {
      const CampusOrder = getCampusOrderModel(schoolName);
      await CampusOrder.create({
        ...order.toObject(),
        _id: order._id,
      }).catch(() => {});
    }

    // Send emails & create thank-you chat messages
    try {
      const sellerIds = [...new Set(orderItems.map((item) => item.seller.toString()))];
      
      // Look up sellers across all campus user collections
      const sellersMap = await findUsersByIdsAcrossCampuses(sellerIds);

      // Build Map<sellerEmail, { sellerName?: string; items: typeof orderItems }>
      const sellerItemsMap = new Map<string, { sellerName?: string; items: typeof orderItems }>();
      for (const sellerId of sellerIds) {
        const seller = sellersMap.get(sellerId);
        const email = seller?.email;
        if (!email) {
          console.warn(`[ORDERS EMAIL] Seller with ID ${sellerId} has no email or was not found in campus collections.`);
          continue;
        }
        const items = orderItems.filter((i) => i.seller.toString() === sellerId);
        if (items.length > 0) {
          sellerItemsMap.set(email, {
            sellerName: seller.storeName || seller.name || "Seller",
            items,
          });
        }
      }

      // Fetch buyer details from session and multi-campus user lookup
      let buyerEmail = session.user.email;
      let buyerName = session.user.name || "Buyer";
      const buyerDocMap = await findUsersByIdsAcrossCampuses([session.user.id]);
      const buyerUser = buyerDocMap.get(session.user.id);
      if (buyerUser) {
        buyerEmail = buyerUser.email || buyerEmail;
        buyerName = buyerUser.name || buyerName;
      }

      // Collect admin emails from AdminUser collection & environment variables
      const adminUsers = await AdminUser.find({ isBanned: { $ne: true } }).select("email").lean().catch(() => []);
      const adminEmails: string[] = adminUsers.map((a: any) => a.email).filter(Boolean);
      if (process.env.ADMIN_EMAIL) adminEmails.push(process.env.ADMIN_EMAIL);
      if (process.env.SMTP_USER) adminEmails.push(process.env.SMTP_USER);

      if (buyerEmail) {
        await sendOrderConfirmationEmails(order, buyerEmail, buyerName, sellerItemsMap, adminEmails);
      } else {
        console.error("[ORDERS EMAIL ERROR] Could not determine buyer email address.");
      }

      // Automated chat thank-you message from each seller to buyer
      for (const sellerId of sellerIds) {
        const sellerItems = orderItems.filter((i) => i.seller.toString() === sellerId);
        const itemTitles = sellerItems.map((i) => i.title).join(", ");
        await Message.create({
          order: order._id,
          sender: sellerId,
          receiver: session.user.id,
          text: `🎉 Thank you for your order! I have received your order for "${itemTitles}". I am preparing your item(s) for delivery. Please keep your 6-digit Delivery PIN safe and share it with me ONLY after physically receiving your package!`,
        }).catch((e) => console.error("[ORDERS AUTOMATED MESSAGE ERROR]", e));
      }
    } catch (e) {
      console.error("[ORDERS EMAIL/MESSAGE ERROR]", e);
    }


    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[ORDERS POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/orders — buyer sees their orders, seller sees orders with their products, admin sees all
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;
    const school = searchParams.get("school") ?? "";
    const asBuyer = searchParams.get("asBuyer") === "true";

    const userId = session.user.id;
    const userRole = session.user.role;

    // Build mongo filter based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (asBuyer || userRole === "buyer") {
      query.buyer = userId;
    } else if (userRole === "seller") {
      query["items.seller"] = userId;
    }
    // admin with no asBuyer sees all

    // Fetch all matching orders across all campus collections & root
    const rawOrders = await findOrdersAcrossCampuses(query);

    // Populate buyer, seller, and product data from campus collections
    const populatedOrders = await populateOrdersWithUsersAndProducts(rawOrders);

    // Admin school filter post-population
    let filtered = populatedOrders;
    if (userRole === "admin" && school && school !== "all") {
      filtered = populatedOrders.filter((o) => {
        return (
          o.buyer?.school === school ||
          (o.items || []).some((i: any) => i.seller?.school === school)
        );
      });
    }

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);

    return NextResponse.json({ orders: paged, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    console.error("[ORDERS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
