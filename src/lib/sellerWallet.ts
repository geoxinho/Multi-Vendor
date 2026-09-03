import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Withdrawal } from "@/models/Withdrawal";

export interface SellerWalletData {
  availableBalance: number;
  pendingBalance: number;
  /** Earnings locked because admin placed a hold on the order */
  heldBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  hasBankDetails: boolean;
  hasHeldOrders: boolean;
  bankDetails?: {
    bankName?: string;
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
  };
}

export async function getSellerWalletData(sellerId: string): Promise<SellerWalletData> {
  await connectDB();

  const { findUserAcrossCampuses } = await import("@/lib/campusModels");
  const sellerPromise = (async () => {
    const found = await findUserAcrossCampuses({ _id: sellerId });
    if (found?.user) return found.user;
    return User.findById(sellerId).select("name email storeName bankDetails").lean();
  })();

  const [seller, orders, withdrawals] = await Promise.all([
    sellerPromise,
    Order.find({
      "items.seller": sellerId,
      paymentStatus: "paid",
    }).lean(),
    Withdrawal.find({ seller: sellerId, status: "completed" }).lean(),
  ]);

  const now = new Date();

  let availableBalance = 0;
  let pendingBalance = 0;
  let heldBalance = 0;
  let totalEarned = 0;
  let hasHeldOrders = false;

  for (const order of orders) {
    const sellerItems = order.items.filter(
      (item: any) => item.seller?.toString() === sellerId
    );

    const isDelivered = order.deliveryStatus === "delivered";
    const releaseAt = order.sellerPayoutReleaseAt ? new Date(order.sellerPayoutReleaseAt) : null;
    const isReleased = releaseAt && releaseAt <= now;
    const isHeld = Boolean(order.payoutHeld);
    const isPaidOut = Boolean(order.sellerPaid);

    for (const item of sellerItems) {
      const net = item.netPayout ?? item.price * item.quantity * 0.95;
      totalEarned += net;

      if (!isPaidOut) {
        if (isDelivered && isHeld) {
          // Admin hold — completely locked
          heldBalance += net;
          hasHeldOrders = true;
        } else if (isDelivered && isReleased) {
          // 24h elapsed, not held — available to withdraw
          availableBalance += net;
        } else if (isDelivered) {
          // Delivered but still within 24h window
          pendingBalance += net;
        }
      }
    }
  }

  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

  const bankDetails = seller?.bankDetails;
  const hasBankDetails = Boolean(
    bankDetails?.accountNumber && bankDetails?.bankName && bankDetails?.accountName
  );

  return {
    availableBalance: Math.max(0, Math.round(availableBalance)),
    pendingBalance: Math.max(0, Math.round(pendingBalance)),
    heldBalance: Math.max(0, Math.round(heldBalance)),
    totalEarned: Math.round(totalEarned),
    totalWithdrawn: Math.round(totalWithdrawn),
    hasHeldOrders,
    hasBankDetails,
    bankDetails: bankDetails
      ? {
          bankName: bankDetails.bankName || "",
          bankCode: bankDetails.bankCode || "",
          accountNumber: bankDetails.accountNumber || "",
          accountName: bankDetails.accountName || "",
        }
      : undefined,
  };
}
