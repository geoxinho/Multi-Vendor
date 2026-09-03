import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";
import { getAllActiveSchools, getCampusProductModel, getCampusUserModel } from "@/lib/campusModels";

// GET /api/admin/products — admin only, all statuses, scans campus collections
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
    const statusFilter = searchParams.get("status") ?? "";
    const search = searchParams.get("search") ?? "";
    const schoolFilter = searchParams.get("school") ?? "";

    // Build per-model filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildQuery = (): any => {
      const q: Record<string, any> = {};
      if (statusFilter && statusFilter !== "all") q.status = statusFilter;
      if (search) q.title = { $regex: search, $options: "i" };
      if (schoolFilter && schoolFilter !== "all") q.school = schoolFilter;
      return q;
    };

    const schools = await getAllActiveSchools();

    // Gather all products across campus collections + legacy
    const models = [
      ...schools.map((s) => getCampusProductModel(s.slug)),
      Product,
    ];

    const allProducts: any[] = [];
    const seenIds = new Set<string>();

    await Promise.all(
      models.map(async (model) => {
        try {
          const docs = await model
            .find(buildQuery())
            .populate("category", "name")
            .sort({ createdAt: -1 })
            .lean();
          for (const doc of docs) {
            const idStr = (doc as any)._id.toString();
            if (!seenIds.has(idStr)) {
              seenIds.add(idStr);
              allProducts.push(doc);
            }
          }
        } catch (err) {
          console.error("[ADMIN PRODUCTS GET] model error:", err);
        }
      })
    );

    // Sort all merged results by createdAt desc
    allProducts.sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    // Populate sellers across campus user models
    const sellerIds = [...new Set(allProducts.map((p) => p.seller?.toString()).filter(Boolean))];
    const sellerMap = new Map<string, any>();
    const userModels: any[] = schools.map((s) => getCampusUserModel(s.slug));
    try {
      const { User } = await import("@/models/User");
      userModels.push(User);
    } catch {}
    await Promise.all(
      userModels.map(async (m: any) => {
        try {
          const users = await m.find({ _id: { $in: sellerIds } }).select("name storeName email school").lean();
          for (const u of users) sellerMap.set((u as any)._id.toString(), u);
        } catch {}
      })
    );

    const enriched = allProducts.map((p) => {
      const sId = p.seller?.toString();
      return { ...p, seller: sId && sellerMap.has(sId) ? sellerMap.get(sId) : p.seller };
    });

    // Paginate after merge
    const total = enriched.length;
    const paginated = enriched.slice((page - 1) * limit, page * limit);

    // Count pending across all campus collections
    let pendingCount = 0;
    await Promise.all(
      models.map(async (model) => {
        try {
          pendingCount += await model.countDocuments({ status: "pending_approval" });
        } catch {}
      })
    );
    // Deduplicate pending count by IDs
    const pendingIds = new Set<string>();
    await Promise.all(
      models.map(async (model) => {
        try {
          const docs = await model.find({ status: "pending_approval" }).select("_id").lean();
          for (const d of docs) pendingIds.add((d as any)._id.toString());
        } catch {}
      })
    );
    pendingCount = pendingIds.size;

    return NextResponse.json({
      products: paginated,
      total,
      page,
      pages: Math.ceil(total / limit),
      pendingCount,
    });
  } catch (err) {
    console.error("[ADMIN PRODUCTS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
