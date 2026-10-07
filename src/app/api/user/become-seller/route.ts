import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getCampusUserModel, findUserAcrossCampuses } from "@/lib/campusModels";
import { z } from "zod";

const schema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeDescription: z.string().optional().default(""),
  sellerCategory: z.string().min(1, "Please select a product category for your store"),
  passport: z.string().min(1, "Passport photograph is required to become a seller"),
  bankName: z.string().min(1, "Bank name is required"),
  bankCode: z.string().min(1, "Bank code is required"),
  accountNumber: z.string().regex(/^\d{10}$/, "Account number must be 10 digits"),
  accountName: z.string().min(1, "Verified account name is required"),
  school: z.string().optional(),
});

/**
 * POST /api/user/become-seller
 * Adds "seller" to the user's roles array, saves store info, category, bank details and passport, switches to seller.
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
    
    // 1. Check campus model
    const school = session.user.school;
    let user: any = null;
    let CampusUser: any = null;

    if (school) {
      CampusUser = getCampusUserModel(school);
      user = await CampusUser.findById(session.user.id);
    }

    if (!user) {
      const searchRes = await findUserAcrossCampuses({ _id: session.user.id });
      if (searchRes) {
        CampusUser = getCampusUserModel(searchRes.campusSlug);
        user = await CampusUser.findById(session.user.id);
      }
    }

    if (!user) {
      user = await User.findById(session.user.id);
    }

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Add seller to roles if not already there
    const roles = user.roles && user.roles.length > 0 ? [...user.roles] : [user.role];
    if (!roles.includes("seller")) roles.push("seller");

    // Switch active role to seller & save full seller profile
    user.role = "seller";
    user.roles = roles as ("buyer" | "seller" | "admin")[];
    user.storeName = parsed.data.storeName;
    user.storeDescription = parsed.data.storeDescription;
    user.sellerCategory = parsed.data.sellerCategory;
    user.passport = parsed.data.passport;
    user.avatar = parsed.data.passport;
    user.bankDetails = {
      bankName: parsed.data.bankName,
      bankCode: parsed.data.bankCode,
      accountNumber: parsed.data.accountNumber,
      accountName: parsed.data.accountName,
    };
    if (parsed.data.school && !user.school) {
      user.school = parsed.data.school;
    }
    await user.save();

    // Mirror update to User fallback if exists
    await User.findByIdAndUpdate(session.user.id, {
      role: "seller",
      roles,
      storeName: parsed.data.storeName,
      storeDescription: parsed.data.storeDescription,
      sellerCategory: parsed.data.sellerCategory,
      passport: parsed.data.passport,
      avatar: parsed.data.passport,
      bankDetails: user.bankDetails,
      ...(user.school ? { school: user.school } : {}),
    }).catch(() => {});

    return NextResponse.json({
      role: "seller",
      roles,
      storeName: user.storeName,
      sellerCategory: user.sellerCategory,
      passport: user.passport,
      avatar: user.avatar,
      image: user.avatar,
      school: user.school,
    });
  } catch (err) {
    console.error("[BECOME SELLER]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
