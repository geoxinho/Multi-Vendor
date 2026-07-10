import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      phone: user.phone || "",
      storeName: user.storeName || "",
      storeDescription: user.storeDescription || "",
      lastBrandNameChangeAt: user.lastBrandNameChangeAt || null,
    });
  } catch (error) {
    console.error("GET Seller Settings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, storeName, storeDescription } = body;

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if storeName is being changed
    if (storeName && storeName !== user.storeName) {
      const now = new Date();
      if (user.lastBrandNameChangeAt) {
        const lastChange = new Date(user.lastBrandNameChangeAt);
        const daysSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 3600 * 24);
        if (daysSinceChange < 365) {
          const daysLeft = Math.ceil(365 - daysSinceChange);
          return NextResponse.json(
            { error: `You can only change your brand name once a year. Please wait ${daysLeft} more days.` },
            { status: 400 }
          );
        }
      }
      
      user.storeName = storeName;
      user.lastBrandNameChangeAt = now;
    }

    if (phone !== undefined) user.phone = phone;
    if (storeDescription !== undefined) user.storeDescription = storeDescription;

    await user.save();

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("PUT Seller Settings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
