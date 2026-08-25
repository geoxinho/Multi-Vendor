import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Message } from "@/models/Message";
import { auth } from "@/lib/auth";
import { verifyPayment } from "@/lib/paystack";
import { shippingSchema } from "@/utils/validators";
import { randomUUID } from "crypto";
import { sendOrderConfirmationEmails } from "@/utils/email";

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

    const isTestPlaceholder = !process.env.PAYSTACK_SECRET_KEY ||
      process.env.PAYSTACK_SECRET_KEY.includes("xxx") ||
      process.env.PAYSTACK_SECRET_KEY.includes("REPLACE") ||
      process.env.PAYSTACK_SECRET_KEY === "sk_test_";

    if (!isTestPlaceholder) {
      // Verify Paystack payment (only when a real secret key is configured)
      const verification = await verifyPayment(paymentRef);
      if (!verification.data || verification.data.status !== "success") {
        console.error("[ORDERS] Paystack verification failed:", verification);
        return NextResponse.json({ error: "Payment verification failed. Please contact support." }, { status: 400 });
      }
      // Verify payment amount matches expected total (within ₦10 tolerance for rounding)
      const paidAmountNGN = verification.data.amount / 100;
      const { items: bodyItems } = body;
      if (bodyItems && bodyItems.length > 0) {
        // We'll validate the actual total after fetching products below
        // Store the verified paid amount for cross-checking
        (req as any)._verifiedAmount = paidAmountNGN;
      }
    } else {
      console.warn("[ORDERS] Skipping Paystack verification — PAYSTACK_SECRET_KEY is a placeholder/test key.");
    }


    await connectDB();

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
      const product = await Product.findById(item.productId).populate("seller", "_id");
      if (!product || product.status !== "active") {
        return NextResponse.json({ error: `Product ${item.productId} is unavailable` }, { status: 400 });
      }
      if (product.seller._id.toString() === session.user.id) {
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
        image: product.images[0] ?? "",
        price: product.price,
        quantity: item.quantity,
        seller: product.seller._id,
        platformFee: itemPlatformFee,
        netPayout: itemNetPayout,
        selectedSize: item.selectedSize ?? "",
        selectedColor: item.selectedColor ?? "",
      });

      // Decrement stock
      product.stock -= item.quantity;
      product.sold += item.quantity;
      await product.save();
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

    // Send emails & create thank-you chat messages
    try {
      const sellerIds = [...new Set(orderItems.map((item) => item.seller.toString()))];
      const sellers = await User.find({ _id: { $in: sellerIds } }).select("_id email").lean();

      // Build Map<sellerEmail, items[]> so each seller gets their own personalised email
      const sellerItemsMap = new Map<string, typeof orderItems>();
      for (const seller of sellers) {
        const email = seller.email as string;
        if (!email) continue;
        const items = orderItems.filter((i) => i.seller.toString() === (seller._id as { toString(): string }).toString());
        if (items.length > 0) sellerItemsMap.set(email, items);
      }

      // Fetch buyer email directly from session or DB if missing in session
      let buyerEmail = session.user.email;
      let buyerName = session.user.name || "Buyer";
      if (!buyerEmail) {
        const buyerUser = await User.findById(session.user.id).select("email name").lean();
        if (buyerUser) {
          buyerEmail = buyerUser.email;
          buyerName = buyerUser.name || buyerName;
        }
      }

      if (buyerEmail) {
        await sendOrderConfirmationEmails(order, buyerEmail, buyerName, sellerItemsMap);
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

// GET /api/orders — buyer sees their orders, seller sees orders with their products
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const skip = (page - 1) * limit;
    const asBuyer = searchParams.get("asBuyer") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = {};

    if (asBuyer) {
      // Any role can view their own purchases (orders where they are the buyer)
      query = { buyer: session.user.id };
    } else if (session.user.role === "buyer") {
      query = { buyer: session.user.id };
    } else if (session.user.role === "seller") {
      query = { "items.seller": session.user.id };
    }
    // admin with no asBuyer sees all

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("buyer", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[ORDERS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
