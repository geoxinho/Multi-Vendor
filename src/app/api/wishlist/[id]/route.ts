import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Wishlist } from "@/models/Wishlist";

/** DELETE /api/wishlist/[id] — remove a wishlist item by its document _id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    // Ensure the item belongs to the current user before deleting
    const item = await Wishlist.findOneAndDelete({
      _id: id,
      buyer: session.user.id,
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ removed: true });
  } catch (err) {
    console.error("[WISHLIST DELETE BY ID]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
