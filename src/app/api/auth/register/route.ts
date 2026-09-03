import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@/models/AdminUser";
import { getCampusUserModel, findUserAcrossCampuses } from "@/lib/campusModels";
import { registerSchema } from "@/utils/validators";
import { randomBytes } from "crypto";
import { sendVerificationEmail, sendWelcomeEmail } from "@/utils/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, name, email, password, role, phone, hearAboutUs, school, nin, sellerCategory, storeName, storeDescription, bankName, bankCode, accountNumber, accountName, passport } = parsed.data;
    const fullName = `${firstName} ${lastName}`.trim() || name || "";

    const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    await connectDB();

    // Check if email already in use by Admin or any Campus User
    const existingAdmin = await AdminUser.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const existingCampusUser = await findUserAcrossCampuses({ email });
    if (existingCampusUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    if (role === "seller" && !storeName) {
      return NextResponse.json({ error: "Store name is required for sellers" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    // Generate 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const CampusUser = getCampusUserModel(school || "");
    const user = await CampusUser.create({
      name: fullName,
      firstName,
      lastName,
      email,
      password: hashed,
      role,
      phone,
      hearAboutUs,
      nin: role === "seller" ? nin : "",
      sellerCategory: role === "seller" ? sellerCategory : "",
      school,
      passport: role === "seller" ? (passport ?? "") : "",
      avatar: role === "seller" ? (passport ?? "") : "",
      storeName: role === "seller" ? (storeName ?? "") : "",
      storeDescription: role === "seller" ? (storeDescription ?? "") : "",
      bankDetails: role === "seller" ? {
        bankName: bankName ?? "",
        bankCode: bankCode ?? "",
        accountNumber: accountNumber ?? "",
        accountName: accountName ?? "",
      } : undefined,
      isEmailVerified: !hasSMTP, // Auto-verify if no SMTP is configured
      emailVerificationToken: token,
      emailVerificationTokenExpires: tokenExpires,
    });

    // Send verification email only if SMTP is configured
    if (hasSMTP) {
      await sendVerificationEmail(email, token);
      await sendWelcomeEmail(email, fullName);
    } else {
      await sendWelcomeEmail(email, fullName); // Will use mock
    }

    return NextResponse.json(
      { 
        message: "Account created", 
        userId: user._id.toString(),
        autoVerified: !hasSMTP,
        ...(process.env.NODE_ENV === "development" ? { devToken: token } : {})
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
