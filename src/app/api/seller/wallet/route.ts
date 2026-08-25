import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getSellerWalletData } from "@/lib/sellerWallet";
import { Withdrawal } from "@/models/Withdrawal";
import { Order } from "@/models/Order";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const sellerId = session.user.id;

    const wallet = await getSellerWalletData(sellerId);

    // Get past withdrawals
    const withdrawals = await Withdrawal.find({ seller: sellerId })
      .sort("-createdAt")
      .lean();

    // Get all delivered orders for this seller — both pending, held and paid
    const orders = await Order.find({
      "items.seller": sellerId,
      deliveryStatus: "delivered",
      paymentStatus: "paid",
    })
      .sort("-deliveredAt")
      .lean();

    const now = new Date();

    const orderList = orders.map((o) => {
      const sellerItems = o.items.filter((i: any) => i.seller?.toString() === sellerId);
      const netPayout = sellerItems.reduce(
        (sum: number, i: any) => sum + (i.netPayout ?? i.price * i.quantity * 0.95),
        0
      );

      const releaseAt = o.sellerPayoutReleaseAt ? new Date(o.sellerPayoutReleaseAt) : null;
      const isReleased = releaseAt && releaseAt <= now;
      const isHeld = Boolean(o.payoutHeld);
      const isPaidOut = Boolean(o.sellerPaid);

      let lockStatus: "available" | "pending" | "held" | "paid" = "pending";
      if (isPaidOut) lockStatus = "paid";
      else if (isHeld) lockStatus = "held";
      else if (isReleased) lockStatus = "available";

      return {
        _id: o._id.toString(),
        deliveredAt: o.deliveredAt,
        sellerPayoutReleaseAt: o.sellerPayoutReleaseAt,
        sellerPaid: isPaidOut,
        payoutHeld: isHeld,
        payoutHoldReason: o.payoutHoldReason || "",
        netPayout: Math.round(netPayout),
        itemsCount: sellerItems.length,
        lockStatus,
      };
    });

    return NextResponse.json({
      wallet,
      withdrawals,
      orders: orderList,
    });
  } catch (err) {
    console.error("[SELLER WALLET GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
