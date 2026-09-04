import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { findProductAcrossCampuses } from "@/lib/campusModels";
import { auth } from "@/lib/auth";
import { productSchema } from "@/utils/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const result = await findProductAcrossCampuses(id);

    if (!result || !result.product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = result.product;
    const session = await auth();
    const sellerIdStr =
      (product.seller as any)?._id?.toString?.() ||
      (typeof product.seller === "string" ? product.seller : null);
    const isOwner = Boolean(session?.user?.id && sellerIdStr && session.user.id === sellerIdStr);
    const isAdmin = session?.user?.role === "admin";

    if (product.status !== "active") {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Product not available" }, { status: 404 });
      }
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("[PRODUCT GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const found = await findProductAcrossCampuses(id);
    if (!found || !found.product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const product = found.product;
    const sellerId = (product.seller?._id || product.seller)?.toString();
    const isOwner = sellerId === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = productSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const updateData: any = { ...parsed.data };

    if (!isAdmin) {
      // If client sent status
      if (body.status !== undefined) {
        // Seller can only toggle between active and inactive IF product is currently active or inactive
        if (["active", "inactive"].includes(product.status) && ["active", "inactive"].includes(body.status)) {
          updateData.status = body.status;
        } else {
          delete updateData.status;
        }
      }

      // If seller edits a rejected product (changing title, price, etc.), re-submit for review
      if (product.status === "rejected") {
        updateData.status = "pending_approval";
        updateData.rejectionReason = "";
      }
    } else {
      if (body.status) updateData.status = body.status;
      if (body.rejectionReason !== undefined) updateData.rejectionReason = body.rejectionReason;
    }

    const updated = await found.model.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    // Mirror update to fallback Product model if needed
    await Product.findByIdAndUpdate(id, updateData).catch(() => {});

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PRODUCT PUT]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const found = await findProductAcrossCampuses(id);
    if (!found || !found.product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const product = found.product;
    const sellerId = (product.seller?._id || product.seller)?.toString();
    const isOwner = sellerId === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await found.model.findByIdAndDelete(id);
    await Product.findByIdAndDelete(id).catch(() => {});

    return NextResponse.json({ message: "Product deleted" });
  } catch (err) {
    console.error("[PRODUCT DELETE]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
