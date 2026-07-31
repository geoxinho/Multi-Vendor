import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Wishlist } from "@/models/Wishlist";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

/** GET /api/wishlist — list all wishlisted product IDs for current buyer */
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const items = await Wishlist.find({ buyer: session.user.id })
      .populate("product", "title price images condition rating numReviews stock seller")
      .sort("-createdAt")
      .lean();
    return NextResponse.json(items);
  } catch (err) {
    console.error("[WISHLIST GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/wishlist — add product to wishlist */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

    await connectDB();
    await Wishlist.findOneAndUpdate(
      { buyer: session.user.id, product: productId },
      { buyer: session.user.id, product: productId },
      { upsert: true, new: true }
    );
    return NextResponse.json({ wishlisted: true });
  } catch (err) {
    console.error("[WISHLIST POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/wishlist — remove product from wishlist */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { productId } = await req.json();
    await connectDB();
    await Wishlist.findOneAndDelete({ buyer: session.user.id, product: productId });
    return NextResponse.json({ wishlisted: false });
  } catch (err) {
    console.error("[WISHLIST DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
