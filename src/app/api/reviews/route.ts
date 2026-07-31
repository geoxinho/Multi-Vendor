import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/utils/validators";

// POST /api/reviews — buyer submits review
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    const { productId, rating, comment } = parsed.data;

    const existing = await Review.findOne({ product: productId, buyer: session.user.id });
    if (existing) {
      return NextResponse.json({ error: "You already reviewed this product" }, { status: 409 });
    }

    const review = await Review.create({
      product: productId,
      buyer: session.user.id,
      rating,
      comment,
    });

    // Update product rating
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: parseFloat(avgRating.toFixed(1)),
      numReviews: reviews.length,
    });

    await review.populate("buyer", "name avatar");
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("[REVIEWS POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
