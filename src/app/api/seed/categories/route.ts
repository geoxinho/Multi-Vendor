import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";

const DEFAULT_CATEGORIES = [
  "Electronics",
  "Phones & Tablets",
  "Computers & Laptops",
  "Fashion & Clothing",
  "Shoes & Bags",
  "Home & Furniture",
  "Appliances",
  "Health & Beauty",
  "Sports & Outdoors",
  "Automobiles",
  "Books & Education",
  "Baby & Kids",
  "Food & Agriculture",
  "Services",
  "Other",
];

export async function POST() {
  try {
    await connectDB();
    const count = await Category.countDocuments();
    if (count > 0) {
      return NextResponse.json({ message: "Categories already seeded", count });
    }

    const docs = DEFAULT_CATEGORIES.map((name) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      image: "",
    }));

    await Category.insertMany(docs);
    return NextResponse.json({ message: "Categories seeded successfully", count: docs.length });
  } catch (err) {
    console.error("[SEED CATEGORIES]", err);
    return NextResponse.json({ error: "Failed to seed categories" }, { status: 500 });
  }
}
