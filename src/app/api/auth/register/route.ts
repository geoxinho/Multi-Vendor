import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
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

    const { name, email, password, role, phone, hearAboutUs, school, nin, sellerCategory, storeName, storeDescription, bankName, accountNumber, accountName } = parsed.data;

    const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    if (role === "seller" && !storeName) {
      return NextResponse.json({ error: "Store name is required for sellers" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    // Generate 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      phone,
      hearAboutUs,
      nin: role === "seller" ? nin : "",
      sellerCategory: role === "seller" ? sellerCategory : "",
      school,
      storeName: role === "seller" ? (storeName ?? "") : "",
      storeDescription: role === "seller" ? (storeDescription ?? "") : "",
      bankDetails: role === "seller" ? {
        bankName: bankName ?? "",
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
      await sendWelcomeEmail(email, name);
    } else {
      await sendWelcomeEmail(email, name); // Will use mock
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
