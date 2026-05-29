import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

/**
 * GET /api/setup-admin
 * One-time utility to create a default admin user.
 * DELETE THIS FILE AFTER USE FOR SECURITY.
 */
export async function GET() {
  try {
    await connectDB();

    const adminEmail = "admin@markethub.com";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verify hashing works
    const isWorking = await bcrypt.compare(password, hashedPassword);
    if (!isWorking) throw new Error("Bcrypt verification failed");

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      return NextResponse.json({ 
        message: "Admin password has been reset and verified", 
        email: adminEmail,
        password: password
      });
    }



    const newAdmin = await User.create({
      name: "Platform Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      roles: ["admin", "buyer"],
    });

    return NextResponse.json({
      message: "Admin created successfully",
      credentials: {
        email: adminEmail,
        password: "admin123456"
      }
    });
  } catch (error) {
    console.error("Setup Admin Error:", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
