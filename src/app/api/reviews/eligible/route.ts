import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";

/**
 * GET /api/reviews/eligible?productId=xxx
 * Returns whether the current buyer is eligible to review this product.
 * Eligible = has delivered purchase orders for this product,
 *            and has not yet reviewed every delivered order.
 * If a buyer purchased the item multiple times across separate orders,
 * they can review each delivered purchase.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ eligible: false, reason: "not_buyer" });
    }

    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ eligible: false, reason: "no_product" });
    }

    await connectDB();

    // 1. Find all delivered orders for this buyer containing this product
    const deliveredOrders = await Order.find({
      buyer: session.user.id,
      paymentStatus: "paid",
      deliveryStatus: "delivered",
      "items.product": productId,
    }).select("_id").lean();

    const deliveredCount = deliveredOrders.length;
    if (deliveredCount === 0) {
      return NextResponse.json({ eligible: false, reason: "no_delivered_order" });
    }

    // 2. Count how many reviews this buyer has already posted for this product
    const existingReviewsCount = await Review.countDocuments({
      product: productId,
      buyer: session.user.id,
    });

    if (existingReviewsCount >= deliveredCount) {
      return NextResponse.json({
        eligible: false,
        reason: "already_reviewed",
        deliveredCount,
        reviewsCount: existingReviewsCount,
      });
    }

    return NextResponse.json({
      eligible: true,
      deliveredCount,
      reviewsCount: existingReviewsCount,
      remainingReviews: deliveredCount - existingReviewsCount,
      purchaseIndex: existingReviewsCount + 1,
    });
  } catch (err) {
    console.error("[REVIEW ELIGIBLE]", err);
    return NextResponse.json({ eligible: false, reason: "error" });
  }
}
