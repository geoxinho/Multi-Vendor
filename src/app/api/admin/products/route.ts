import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";

// GET /api/admin/products — admin only, all statuses
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const status = searchParams.get("status") ?? "";
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("seller", "name storeName email")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count pending for nav badge
    const pendingCount = await Product.countDocuments({ status: "pending_approval" });

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit), pendingCount });
  } catch (err) {
    console.error("[ADMIN PRODUCTS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
