import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

/**
 * GET /api/setup-admin
 * Reads admin credentials from environment variables (ADMIN_EMAIL, ADMIN_USERNAME,
 * ADMIN_PASSWORD, ADMIN_NAME) and upserts the admin account in the database.
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

    // Update ONLY the account matching the admin email
    const result = await User.updateOne(
      { email: adminEmail },
      {
        $set: {
          name: adminName,
          username: adminUsername,
          password: hashedPassword,
          role: "admin",
          roles: ["admin", "buyer"],
          isEmailVerified: true,
        },
      }
    );

    if (result.matchedCount === 0) {
      // No account found — create fresh
      const newAdmin = await User.create({
        name: adminName,
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        role: "admin",
        roles: ["admin", "buyer"],
        isEmailVerified: true,
      });

      return NextResponse.json({
        message: "✅ Admin created successfully",
        email: newAdmin.email,
        username: newAdmin.username,
        role: newAdmin.role,
        isEmailVerified: newAdmin.isEmailVerified,
        login_url: "/mystartup",
      });
    }

    // Confirm what was saved
    const updated = await User.findOne({ email: adminEmail }).select("-password").lean();

    return NextResponse.json({
      message: "✅ Admin updated successfully",
      email: updated?.email,
      username: updated?.username,
      role: updated?.role,
      isEmailVerified: updated?.isEmailVerified,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
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
