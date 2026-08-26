import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/utils/validators";

// POST /api/reviews — buyer submits review
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized. Please sign in as a buyer to leave a review." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    const { productId, rating, comment } = parsed.data;

    // 1. Verify buyer has a delivered order for this product
    const deliveredOrders = await Order.find({
      buyer: session.user.id,
      paymentStatus: "paid",
      deliveryStatus: "delivered",
      "items.product": productId,
    })
      .sort("deliveredAt")
      .select("_id deliveredAt")
      .lean();

    const deliveredCount = deliveredOrders.length;
    if (deliveredCount === 0) {
      return NextResponse.json(
        { error: "You can only review products that have been delivered to you." },
        { status: 403 }
      );
    }

    // 2. Count existing reviews by this buyer for this product
    const existingReviews = await Review.find({
      product: productId,
      buyer: session.user.id,
    })
      .select("_id order")
      .lean();

    if (existingReviews.length >= deliveredCount) {
      return NextResponse.json(
        {
          error:
            "You have already reviewed all your delivered purchases for this product. Purchase again to leave another review!",
        },
        { status: 409 }
      );
    }

    // Match the review to the corresponding delivered order (if not already matched)
    const reviewedOrderIds = new Set(existingReviews.map((r) => r.order?.toString()).filter(Boolean));
    const nextOrder = deliveredOrders.find((o) => !reviewedOrderIds.has(o._id.toString()));

    const review = await Review.create({
      product: productId,
      buyer: session.user.id,
      order: nextOrder ? nextOrder._id : undefined,
      rating,
      comment: comment.trim(),
    });

    // 3. Update product rating & review count
    const allProductReviews = await Review.find({ product: productId });
    const avgRating =
      allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: parseFloat(avgRating.toFixed(1)),
      numReviews: allProductReviews.length,
    });

    await review.populate("buyer", "name avatar");
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("[REVIEWS POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
