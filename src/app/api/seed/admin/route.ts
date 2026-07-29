import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

/**
 * POST /api/seed/admin
 * Creates the default admin account if none exists using environment variables.
 * Remove or protect this route before going to production.
 */
export async function POST() {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME ?? "Admin";

    if (!adminEmail || !adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: "Missing admin environment variables in .env.local" },
        { status: 500 }
      );
    }

    const existing = await User.findOne({
      $or: [{ email: adminEmail }, { username: adminUsername }, { role: "admin" }],
    });

    if (existing) {
      return NextResponse.json({
        message: "Admin already exists",
        email: existing.email,
        username: existing.username,
      });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      username: adminUsername,
      password: hashedPassword,
      role: "admin",
      roles: ["admin", "buyer"],
      isEmailVerified: true,
    });

    return NextResponse.json({
      message: "Admin created successfully via seed",
      email: admin.email,
      username: admin.username,
    });
  } catch (err) {
    console.error("[SEED ADMIN]", err);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}
