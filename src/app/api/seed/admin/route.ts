import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

/**
 * POST /api/seed/admin
 * Creates the default admin account if none exists.
 * Remove or protect this route before going to production.
 */
export async function POST() {
  try {
    await connectDB();

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      return NextResponse.json({
        message: "Admin already exists",
        email: existing.email,
      });
    }

    const password = await bcrypt.hash("Admin@12345", 12);
    const admin = await User.create({
      name: "Admin",
      email: "n ",
      password,
      role: "admin",
    });

    return NextResponse.json({
      message: "Admin created successfully",
      email: admin.email,
      password: "Admin@12345",
    });
  } catch (err) {
    console.error("[SEED ADMIN]", err);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 },
    );
  }
}
