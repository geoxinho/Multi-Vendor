import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { z } from "zod";

const schema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeDescription: z.string().min(10, "Store description must be at least 10 characters"),
});

/**
 * POST /api/user/become-seller
 * Adds "seller" to the user's roles array, saves store info, switches to seller.
 * Any buyer can call this — admins are excluded.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role === "admin") {
      return NextResponse.json({ error: "Admins cannot become sellers" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Add seller to roles if not already there
    const roles = user.roles && user.roles.length > 0 ? [...user.roles] : [user.role];
    if (!roles.includes("seller")) roles.push("seller");

    // Switch active role to seller
    user.role = "seller";
    user.roles = roles as ("buyer" | "seller" | "admin")[];
    user.storeName = parsed.data.storeName;
    user.storeDescription = parsed.data.storeDescription;
    await user.save();

    return NextResponse.json({ role: "seller", roles });
  } catch (err) {
    console.error("[BECOME SELLER]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
