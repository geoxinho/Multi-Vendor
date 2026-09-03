import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { AdminUser } from "@/models/AdminUser";
import { School } from "@/models/School";
import bcrypt from "bcryptjs";

const DEFAULT_SCHOOLS = [
  {
    name: "Adeleke University",
    slug: "adeleke-university",
    code: "AU",
    city: "Ede",
    state: "Osun",
    isActive: true,
  },
  {
    name: "Federal Polytechnic Ede",
    slug: "federal-polytechnic-ede",
    code: "FPE",
    city: "Ede",
    state: "Osun",
    isActive: true,
  },
];

/**
 * POST /api/admin/reset-database
 * Clears old legacy collections and sets up fresh partitioned database:
 * - Drops legacy 'users', 'products', 'orders', etc.
 * - Seeds fresh admin in 'admins' collection
 * - Seeds default campuses in 'schools' collection
 */
export async function POST(req: NextRequest) {
  try {
    const conn = await connectDB();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const collections = await db.listCollections().toArray();
    const dropped: string[] = [];

    // Drop legacy and campus collections
    for (const col of collections) {
      if (
        col.name === "users" ||
        col.name === "products" ||
        col.name === "orders" ||
        col.name === "messages" ||
        col.name === "reviews" ||
        col.name === "orderreports" ||
        col.name === "wishlists" ||
        col.name === "withdrawals" ||
        col.name.includes("_users") ||
        col.name.includes("_products") ||
        col.name.includes("_orders") ||
        col.name.includes("_messages") ||
        col.name.includes("_reviews") ||
        col.name.includes("_reports") ||
        col.name.includes("_wishlists") ||
        col.name.includes("_withdrawals")
      ) {
        await db.dropCollection(col.name);
        dropped.push(col.name);
      }
    }

    // Ensure default schools exist
    await School.deleteMany({});
    await School.insertMany(DEFAULT_SCHOOLS);

    // Setup Admin in 'admins' collection
    const adminEmail = process.env.ADMIN_EMAIL || "georgex.edg@gmail.com";
    const adminUsername = process.env.ADMIN_USERNAME || "geoxinho";
    const adminPassword = process.env.ADMIN_PASSWORD || "Olarewaju@123";
    const adminName = process.env.ADMIN_NAME || "George Admin";

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await AdminUser.deleteMany({});
    const admin = await AdminUser.create({
      name: adminName,
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      roles: ["admin"],
      isEmailVerified: true,
    });

    return NextResponse.json({
      success: true,
      message: "Database cleared and reinitialized with separate campus collections and admin collection.",
      droppedCollections: dropped,
      adminCreated: {
        email: admin.email,
        collection: "admins",
      },
      schools: DEFAULT_SCHOOLS.map((s) => s.name),
    });
  } catch (err: any) {
    console.error("[RESET DATABASE ERROR]", err);
    return NextResponse.json({ error: err.message || "Failed to reset database" }, { status: 500 });
  }
}
