import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/email";
import { findProductAcrossCampuses } from "@/lib/campusModels";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action, reason } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }
    if (action === "reject" && (!reason || reason.trim().length < 3)) {
      return NextResponse.json({ error: "Please provide a rejection reason" }, { status: 400 });
    }

    await connectDB();

    // Find the product across all campus collections
    const found = await findProductAcrossCampuses(id);
    if (!found || !found.product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { model: CampusProductModel } = found;

    const newStatus = action === "approve" ? "active" : "rejected";
    const updateData: Record<string, any> =
      action === "approve"
        ? { status: "active", rejectionReason: "" }
        : { status: "rejected", rejectionReason: reason.trim() };

    // Update in campus collection
    const updatedProduct = await CampusProductModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Mirror update to legacy Product collection
    await Product.findByIdAndUpdate(id, updateData).catch(() => {});

    // Notify the seller
    const { findUserAcrossCampuses } = await import("@/lib/campusModels");
    const sellerIdStr = (updatedProduct as any).seller?.toString?.() || (updatedProduct as any).seller;
    const sellerFound = sellerIdStr ? await findUserAcrossCampuses({ _id: sellerIdStr }) : null;
    const seller = sellerFound?.user;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusgo.vercel.app";

    if (seller?.email) {
      if (action === "approve") {
        sendMail({
          to: seller.email,
          subject: "✅ Product Approved - CampusGo",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
              <div style="background:linear-gradient(135deg,#A4860E,#c9a72a);padding:32px 40px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;font-weight:900;">Your Product is Approved!</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Your listing is now live on CampusGo</p>
              </div>
              <div style="padding:32px;">
                <p style="color:#111827;font-size:15px;margin:0 0 16px;">Hi <strong>${(seller as any).storeName || seller.name}</strong>,</p>
                <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 24px;">Your product <strong>"${(updatedProduct as any).title}"</strong> has been approved and is now live on CampusGo!</p>
                <div style="text-align:center;">
                  <a href="${appUrl}/dashboard/seller/products" style="display:inline-block;background:#A4860E;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">View My Products</a>
                </div>
              </div>
              <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">CampusGo - Adeleke University Campus Marketplace</p>
              </div>
            </div>
          `,
        }).catch(e => console.error("[APPROVE EMAIL]", e));
      } else {
        sendMail({
          to: seller.email,
          subject: "❌ Product Not Approved - CampusGo",
          html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:#dc2626;padding:32px 40px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;font-weight:900;">Product Not Approved</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Action required on your listing</p>
            </div>
            <div style="padding:32px;">
              <p style="color:#111827;font-size:15px;margin:0 0 16px;">Hi <strong>${(seller as any).storeName || seller.name}</strong>,</p>
              <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 24px;">Your product <strong>"${(updatedProduct as any).title}"</strong> could not be approved. Please review the reason below and update your listing.</p>
              <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;margin:0 0 8px;">Reason for Rejection</p>
                <p style="font-size:14px;color:#1f2937;margin:0;line-height:1.6;">${reason.trim()}</p>
              </div>
              <div style="text-align:center;">
                <a href="${appUrl}/dashboard/seller/products" style="display:inline-block;background:#A4860E;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Edit My Product</a>
              </div>
            </div>
            <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">CampusGo - Adeleke University Campus Marketplace</p>
            </div>
          </div>
        `,
        }).catch(e => console.error("[REJECT EMAIL]", e));
      }
    }

    return NextResponse.json({
      message: action === "approve" ? "Product approved." : "Product rejected. Seller notified.",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("[ADMIN PRODUCT REVIEW]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}