import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { getAllActiveSchools, getCampusUserModel } from "@/lib/campusModels";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { role, isBanned, name, email, phone, storeName } = body;

    // Prevent self-demotion
    if (id === session.user.id && role && role !== "admin") {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};
    if (role && ["buyer", "seller", "admin"].includes(role)) updates.role = role;
    if (typeof isBanned === "boolean") updates.isBanned = isBanned;
    if (name && typeof name === "string" && name.trim()) updates.name = name.trim();
    if (email && typeof email === "string" && email.trim()) updates.email = email.trim().toLowerCase();
    if (typeof phone === "string") updates.phone = phone.trim();
    if (typeof storeName === "string") updates.storeName = storeName.trim();

    // Search and update across campus models
    const activeSchools = await getAllActiveSchools();
    const targetModels = activeSchools.map((s) => getCampusUserModel(s.slug));
    targetModels.push(User);

    let updatedUser: any = null;
    for (const model of targetModels) {
      try {
        const found = await model.findByIdAndUpdate(id, updates, { new: true }).select("-password");
        if (found) {
          updatedUser = found;
          break;
        }
      } catch {}
    }

    if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("[ADMIN USER PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const activeSchools = await getAllActiveSchools();
    const targetModels = activeSchools.map((s) => getCampusUserModel(s.slug));
    targetModels.push(User);

    for (const model of targetModels) {
      try {
        await model.findByIdAndDelete(id);
      } catch {}
    }

    return NextResponse.json({ message: "User deleted" });
  } catch (err) {
    console.error("[ADMIN USER DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
