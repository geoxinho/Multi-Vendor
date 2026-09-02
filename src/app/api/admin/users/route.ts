import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const role = searchParams.get("role") ?? "";
    const activity = searchParams.get("activity") ?? "";
    const skip = (page - 1) * limit;

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Compute activity metrics across all users
    const [
      totalUsers,
      activeUsers,
      inactive7dUsers,
      inactive30dUsers,
      inactive90dUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        $or: [
          { lastActiveAt: { $gte: d7 } },
          { lastActiveAt: { $exists: false }, updatedAt: { $gte: d7 } },
        ],
      }),
      User.countDocuments({
        $or: [
          { lastActiveAt: { $lt: d7, $gte: d30 } },
          { lastActiveAt: { $exists: false }, updatedAt: { $lt: d7, $gte: d30 } },
        ],
      }),
      User.countDocuments({
        $or: [
          { lastActiveAt: { $lt: d30, $gte: d90 } },
          { lastActiveAt: { $exists: false }, updatedAt: { $lt: d30, $gte: d90 } },
        ],
      }),
      User.countDocuments({
        $or: [
          { lastActiveAt: { $lt: d90 } },
          { lastActiveAt: { $exists: false }, updatedAt: { $lt: d90 } },
        ],
      }),
    ]);

    // Build filter query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (role) query.role = role;

    if (activity === "active") {
      query.$or = [
        { lastActiveAt: { $gte: d7 } },
        { lastActiveAt: { $exists: false }, updatedAt: { $gte: d7 } },
      ];
    } else if (activity === "inactive_7d") {
      query.$or = [
        { lastActiveAt: { $lt: d7, $gte: d30 } },
        { lastActiveAt: { $exists: false }, updatedAt: { $lt: d7, $gte: d30 } },
      ];
    } else if (activity === "inactive_30d") {
      query.$or = [
        { lastActiveAt: { $lt: d30, $gte: d90 } },
        { lastActiveAt: { $exists: false }, updatedAt: { $lt: d30, $gte: d90 } },
      ];
    } else if (activity === "inactive_90d") {
      query.$or = [
        { lastActiveAt: { $lt: d90 } },
        { lastActiveAt: { $exists: false }, updatedAt: { $lt: d90 } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
      activityStats: {
        total: totalUsers,
        active: activeUsers,
        inactive7d: inactive7dUsers,
        inactive30d: inactive30dUsers,
        inactive90d: inactive90dUsers,
      },
    });
  } catch (err) {
    console.error("[ADMIN USERS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
