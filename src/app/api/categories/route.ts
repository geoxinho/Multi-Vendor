import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort("name").lean();
    return NextResponse.json(categories);
  } catch (err) {
    console.error("[CATEGORIES GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, image } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    await connectDB();
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const category = await Category.create({ name, slug, image: image ?? "" });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("[CATEGORIES POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await req.json();
    await connectDB();
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: "Category deleted" });
  } catch (err) {
    console.error("[CATEGORIES DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
