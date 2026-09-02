import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderReport } from "@/models/OrderReport";
import { Order } from "@/models/Order";
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
    const { status, adminNotes, togglePayoutHold, payoutHoldReason } = body;

    await connectDB();

    const report = await OrderReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (status) {
      report.status = status;
      if (status === "resolved" || status === "dismissed") {
        report.resolvedAt = new Date();
        report.resolvedBy = session.user.id as any;
      }
    }

    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes;
    }

    await report.save();

    // Optionally update order payout hold if requested
    if (togglePayoutHold !== undefined) {
      const order = await Order.findById(report.order);
      if (order && !order.sellerPaid) {
        order.payoutHeld = Boolean(togglePayoutHold);
        if (payoutHoldReason !== undefined) {
          order.payoutHoldReason = payoutHoldReason;
        }
        await order.save();
      }
    }

    return NextResponse.json({ message: "Report updated successfully", report });
  } catch (err) {
    console.error("[ADMIN REPORT PATCH]", err);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
