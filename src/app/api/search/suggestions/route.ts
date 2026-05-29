import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";

/**
 * GET /api/search/suggestions?q=xxx
 * Returns matching categories and product titles for the autocomplete dropdown.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ categories: [], products: [] });

    await connectDB();
    const regex = new RegExp(q, "i");

    const [categories, products] = await Promise.all([
      Category.find({ name: regex }).select("name slug _id").limit(5).lean(),
      Product.find({ status: "active", title: regex })
        .select("title images price _id")
        .limit(6)
        .lean(),
    ]);

    return NextResponse.json({ categories, products });
  } catch (err) {
    console.error("[SEARCH SUGGESTIONS]", err);
    return NextResponse.json({ categories: [], products: [] });
  }
}
