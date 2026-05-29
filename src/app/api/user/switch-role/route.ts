import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * POST /api/user/switch-role
 * Body: { role: "buyer" | "seller" }
 * Switches the user's active role (only allowed if they already have that role).
 * The client calls session.update({ role, roles }) to refresh the JWT.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role } = await req.json();
    if (!role || !["buyer", "seller"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userRoles = (user.roles && user.roles.length > 0)
      ? user.roles as string[]
      : [user.role as string];

    if (!userRoles.includes(role)) {
      return NextResponse.json({ error: "You don't have this role" }, { status: 403 });
    }

    // Update active role in DB
    await User.findByIdAndUpdate(session.user.id, { role });

    return NextResponse.json({ role, roles: userRoles });
  } catch (err) {
    console.error("[SWITCH ROLE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
