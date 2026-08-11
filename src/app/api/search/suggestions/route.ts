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

    const [categories, products, tagsAggregation] = await Promise.all([
      Category.find({ name: regex }).select("name slug _id").limit(5).lean(),
      Product.find({ status: "active", $or: [{ title: regex }, { tags: regex }, { description: regex }] })
        .select("title images price _id")
        .limit(6)
        .lean(),
      Product.aggregate([
        { $match: { status: "active", tags: regex } },
        { $unwind: "$tags" },
        { $match: { tags: regex } },
        { $group: { _id: { $toLower: "$tags" } } },
        { $limit: 5 },
        { $project: { _id: 0, tag: "$_id" } }
      ])
    ]);

    const tags = tagsAggregation.map(t => t.tag);

    return NextResponse.json({ categories, products, tags });
  } catch (err) {
    console.error("[SEARCH SUGGESTIONS]", err);
    return NextResponse.json({ categories: [], products: [] });
  }
}
