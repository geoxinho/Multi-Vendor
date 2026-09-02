import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { School } from "@/models/School";
import { auth } from "@/lib/auth";

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

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const count = await School.countDocuments();
    if (count === 0) {
      await School.insertMany(DEFAULT_SCHOOLS);
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    const filter = includeInactive ? {} : { isActive: true };
    const schools = await School.find(filter).sort({ name: 1 }).lean();

    return NextResponse.json(schools);
  } catch (err) {
    console.error("[SCHOOLS GET]", err);
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const body = await req.json();
    const { name, code, city, state } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "School name is required" }, { status: 400 });
    }

    await connectDB();

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await School.findOne({
      $or: [{ name: name.trim() }, { slug }],
    });

    if (existing) {
      return NextResponse.json({ error: "A school with this name already exists" }, { status: 409 });
    }

    const school = await School.create({
      name: name.trim(),
      slug,
      code: code ? code.trim().toUpperCase() : "",
      city: city ? city.trim() : "",
      state: state ? state.trim() : "",
      isActive: true,
    });

    return NextResponse.json(school, { status: 201 });
  } catch (err) {
    console.error("[SCHOOLS POST]", err);
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }
}
