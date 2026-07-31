import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import { auth } from "@/lib/auth";
import { productSchema } from "@/utils/validators";

// GET /api/products — public listing with filters
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const condition = searchParams.get("condition") ?? "";
    const minPrice = parseFloat(searchParams.get("minPrice") ?? "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "999999999");
    const sort = searchParams.get("sort") ?? "-createdAt";
    const sellerId = searchParams.get("seller") ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { status: "active" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice < 999999999) query.price = { $gte: minPrice, $lte: maxPrice };
    if (sellerId) query.seller = sellerId;

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("seller", "name storeName avatar")
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      { products, total, page, pages: Math.ceil(total / limit) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[PRODUCTS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/products — seller only
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();

    const product = await Product.create({
      ...parsed.data,
      seller: session.user.id,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[PRODUCTS POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
