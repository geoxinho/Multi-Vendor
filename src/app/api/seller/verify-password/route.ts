import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password || typeof password !== "string" || !password.trim()) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    await connectDB();
    const sellerId = session.user.id;

    const { getCampusUserModel, findUserAcrossCampuses } = await import("@/lib/campusModels");

    let seller: any = null;

    // Try campus-specific collections first
    if (session.user.school) {
      try {
        const CampusUser = getCampusUserModel(session.user.school);
        seller = await CampusUser.findById(sellerId).select("password").lean();
      } catch {}
    }
    if (!seller) {
      const found = await findUserAcrossCampuses({ _id: sellerId });
      if (found) {
        const CampusUser = getCampusUserModel(found.campusSlug);
        seller = await CampusUser.findById(sellerId).select("password").lean();
      }
    }
    if (!seller) {
      seller = await User.findById(sellerId).select("password").lean();
    }

    if (!seller || !seller.password) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password.trim(), seller.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
    }

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("[VERIFY-PASSWORD]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
