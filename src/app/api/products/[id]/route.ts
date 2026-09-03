import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import { auth } from "@/lib/auth";
import { productSchema } from "@/utils/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id)
      .populate("seller", "name storeName email phone avatar storeDescription school nin bankDetails")
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const session = await auth();
    const isOwner = session && (product.seller as any)?._id?.toString() === session.user.id;
    const isAdmin = session && session.user.role === "admin";

    if (product.status !== "active") {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Product not available" }, { status: 404 });
      }
    }

    // Cross-campus isolation: Block viewing products belonging to a different campus
    if (session?.user && !isAdmin && !isOwner && session.user.school) {
      const productSchool = product.school || (product.seller as any)?.school;
      if (productSchool && productSchool !== session.user.school) {
        return NextResponse.json(
          { error: `This product is only available for students at ${productSchool}` },
          { status: 404 }
        );
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
    const product = await Product.findById(id);
    if (!product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = product.seller.toString() === session.user.id;
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

    const updated = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });
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
    const product = await Product.findById(id);
    if (!product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = product.seller.toString() === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await product.deleteOne();
    return NextResponse.json({ message: "Product deleted" });
  } catch (err) {
    console.error("[PRODUCT DELETE]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
