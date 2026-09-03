import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@/models/AdminUser";
import bcrypt from "bcryptjs";

/**
 * GET /api/setup-admin
 * Reads admin credentials from environment variables and upserts into the 'admins' collection.
 */
export async function GET() {
  try {
    await connectDB();

    // Read credentials from env — never hardcoded
    const adminEmail    = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName     = process.env.ADMIN_NAME ?? "Admin";

    if (!adminEmail || !adminUsername || !adminPassword) {
      return NextResponse.json(
        {
          error: "Missing admin environment variables.",
          missing: {
            ADMIN_EMAIL:    !adminEmail,
            ADMIN_USERNAME: !adminUsername,
            ADMIN_PASSWORD: !adminPassword,
          },
          fix: "Add ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_NAME to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Verify bcrypt works correctly
    const isMatch = await bcrypt.compare(adminPassword, hashedPassword);
    if (!isMatch) throw new Error("Bcrypt verification failed");

    // Upsert admin in 'admins' collection
    const result = await AdminUser.updateOne(
      { email: adminEmail },
      {
        $set: {
          name: adminName,
          username: adminUsername,
          password: hashedPassword,
          role: "admin",
          roles: ["admin"],
          isEmailVerified: true,
        },
      },
      { upsert: true }
    );

    const savedAdmin = await AdminUser.findOne({ email: adminEmail }).select("-password").lean();

    return NextResponse.json({
      message: "✅ Admin successfully configured in 'admins' collection",
      email: savedAdmin?.email,
      username: savedAdmin?.username,
      role: savedAdmin?.role,
      login_url: "/mystartup",
    });
  } catch (error) {
    console.error("Setup Admin Error:", error);
    return NextResponse.json(
      { error: "Failed to setup admin", details: String(error) },
      { status: 500 }
    );
  }
}
