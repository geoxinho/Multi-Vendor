import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { School } from "@/models/School";
import { auth } from "@/lib/auth";

/**
 * POST /api/user/set-school
 * Sets or updates the campus for an authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const schoolName = (body.school || "").trim();

    if (!schoolName) {
      return NextResponse.json({ error: "Campus name is required" }, { status: 400 });
    }

    await connectDB();

    // Verify school exists and is active (or fallback to match by name)
    const validSchool = await School.findOne({
      name: schoolName,
      isActive: { $ne: false },
    }).lean();

    const finalSchoolName = validSchool ? validSchool.name : schoolName;

    // Update user record
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { school: finalSchoolName },
      { new: true }
    ).select("name email role school");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Campus updated successfully",
      school: updatedUser.school,
    });
  } catch (error) {
    console.error("POST /api/user/set-school error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
