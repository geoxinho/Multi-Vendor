import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";

/**
 * GET /api/reviews/eligible?productId=xxx
 * Returns whether the current buyer is eligible to review this product.
 * Eligible = has a paid + delivered order containing the product,
 *            and has NOT already submitted a review.
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

    // Check for a delivered order containing this product
    const deliveredOrder = await Order.findOne({
      buyer: session.user.id,
      paymentStatus: "paid",
      deliveryStatus: "delivered",
      "items.product": productId,
    }).lean();

    if (!deliveredOrder) {
      return NextResponse.json({ eligible: false, reason: "no_delivered_order" });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      product: productId,
      buyer: session.user.id,
    }).lean();

    if (existingReview) {
      return NextResponse.json({ eligible: false, reason: "already_reviewed" });
    }

    return NextResponse.json({ eligible: true });
  } catch (err) {
    console.error("[REVIEW ELIGIBLE]", err);
    return NextResponse.json({ eligible: false, reason: "error" });
  }
}
