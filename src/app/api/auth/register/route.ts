import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { registerSchema } from "@/utils/validators";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/utils/email";

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

    const { name, email, password, role, phone, hearAboutUs, nin, sellerCategory, storeName, storeDescription } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    if (role === "seller" && !storeName) {
      return NextResponse.json({ error: "Store name is required for sellers" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    // Generate secure email verification token
    const token = randomBytes(32).toString("hex");
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
      storeName: role === "seller" ? (storeName ?? "") : "",
      storeDescription: role === "seller" ? (storeDescription ?? "") : "",
      isEmailVerified: false,
      emailVerificationToken: token,
      emailVerificationTokenExpires: tokenExpires,
    });

    // Send verification email
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { 
        message: "Account created", 
        userId: user._id.toString(),
        ...(process.env.NODE_ENV === "development" ? { devToken: token } : {})
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
