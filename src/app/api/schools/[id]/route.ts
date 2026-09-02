import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { School } from "@/models/School";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const school = await School.findById(id);
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (body.name !== undefined) {
      school.name = body.name.trim();
      school.slug = body.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (body.code !== undefined) school.code = body.code.trim().toUpperCase();
    if (body.city !== undefined) school.city = body.city.trim();
    if (body.state !== undefined) school.state = body.state.trim();
    if (body.isActive !== undefined) school.isActive = Boolean(body.isActive);

    await school.save();

    return NextResponse.json(school);
  } catch (err) {
    console.error("[SCHOOL PATCH]", err);
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const deleted = await School.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "School deleted successfully" });
  } catch (err) {
    console.error("[SCHOOL DELETE]", err);
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
  }
}
