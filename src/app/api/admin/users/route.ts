import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { getAllActiveSchools, getCampusUserModel } from "@/lib/campusModels";

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
    const school = searchParams.get("school") ?? "";
    const skip = (page - 1) * limit;

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Build filter query - strictly exclude admins from campus users list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { role: { $ne: "admin" } };
    if (role && role !== "all") query.role = role;
    if (school && school !== "all") query.school = school;

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

    // Determine which models to query based on school filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let targetModels: any[] = [];
    if (school && school !== "all") {
      targetModels = [getCampusUserModel(school), User];
    } else {
      const activeSchools = await getAllActiveSchools();
      targetModels = activeSchools.map((s) => getCampusUserModel(s.slug));
      targetModels.push(User);
    }

    // Fetch users & stats across target campus models
    const allUsersMap = new Map<string, any>();
    let totalUsers = 0;
    let activeUsers = 0;
    let inactive7dUsers = 0;
    let inactive30dUsers = 0;
    let inactive90dUsers = 0;

    await Promise.all(
      targetModels.map(async (model) => {
        try {
          const [
            campusTotal,
            campusActive,
            campusInactive7d,
            campusInactive30d,
            campusInactive90d,
            campusDocs,
          ] = await Promise.all([
            model.countDocuments({ role: { $ne: "admin" } }),
            model.countDocuments({
              role: { $ne: "admin" },
              $or: [
                { lastActiveAt: { $gte: d7 } },
                { lastActiveAt: { $exists: false }, updatedAt: { $gte: d7 } },
              ],
            }),
            model.countDocuments({
              role: { $ne: "admin" },
              $or: [
                { lastActiveAt: { $lt: d7, $gte: d30 } },
                { lastActiveAt: { $exists: false }, updatedAt: { $lt: d7, $gte: d30 } },
              ],
            }),
            model.countDocuments({
              role: { $ne: "admin" },
              $or: [
                { lastActiveAt: { $lt: d30, $gte: d90 } },
                { lastActiveAt: { $exists: false }, updatedAt: { $lt: d30, $gte: d90 } },
              ],
            }),
            model.countDocuments({
              role: { $ne: "admin" },
              $or: [
                { lastActiveAt: { $lt: d90 } },
                { lastActiveAt: { $exists: false }, updatedAt: { $lt: d90 } },
              ],
            }),
            model
              .find(query)
              .select("-password")
              .sort("-createdAt")
              .limit(100)
              .lean(),
          ]);

          totalUsers += campusTotal;
          activeUsers += campusActive;
          inactive7dUsers += campusInactive7d;
          inactive30dUsers += campusInactive30d;
          inactive90dUsers += campusInactive90d;

          for (const doc of campusDocs) {
            const id = doc._id.toString();
            if (!allUsersMap.has(id)) {
              allUsersMap.set(id, doc);
            }
          }
        } catch {
          // Model collection may be empty or not yet created
        }
      })
    );

    const allMatchingUsers = Array.from(allUsersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = allMatchingUsers.length;
    const paginatedUsers = allMatchingUsers.slice(skip, skip + limit);

    return NextResponse.json({
      users: paginatedUsers,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
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
