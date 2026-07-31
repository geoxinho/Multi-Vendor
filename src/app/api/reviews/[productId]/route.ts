import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { User } from "@/models/User";
import { Product } from "@/models/Product";

type Params = { params: Promise<{ productId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { productId } = await params;

    const reviews = await Review.find({ product: productId })
      .populate("buyer", "name avatar")
      .sort("-createdAt")
      .lean();

    return NextResponse.json(reviews);
  } catch (err) {
    console.error("[REVIEWS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
