"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SellerWalletCard from "@/components/seller/SellerWalletCard";

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
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

interface WithdrawalItem {
  _id: string;
  amount: number;
  bankDetails: { bankName: string; accountNumber: string; accountName: string };
  status: string;
  createdAt: string;
}

interface OrderItem {
  _id: string;
  deliveredAt: string;
  sellerPayoutReleaseAt: string;
  sellerPaid: boolean;
  payoutHeld: boolean;
  payoutHoldReason?: string;
  netPayout: number;
  lockStatus: "available" | "pending" | "held" | "paid";
}

export default function SellerPayoutsPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = () => {
    setLoading(true);
    fetch("/api/seller/wallet")
      .then((r) => r.json())
      .then((d) => {
        if (d.wallet) setWallet(d.wallet);
        if (Array.isArray(d.withdrawals)) setWithdrawals(d.withdrawals);
        if (Array.isArray(d.orders)) setOrders(d.orders);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  if (loading || !wallet) return <LoadingSpinner className="py-32" size="lg" />;

  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Seller Wallet &amp; Payouts</h1>
      <p className="text-gray-500 text-sm mb-6">
        Your 95% earnings enter the wallet immediately. Funds unlock 24 hrs after delivery confirmation.
      </p>

      {/* ── SELLER WALLET CARD ── */}
      <SellerWalletCard
        availableBalance={wallet.availableBalance}
        pendingBalance={wallet.pendingBalance}
        heldBalance={wallet.heldBalance}
        totalEarned={wallet.totalEarned}
        hasBankDetails={wallet.hasBankDetails}
        bankDetails={wallet.bankDetails}
        hasHeldOrders={wallet.hasHeldOrders}
        onWithdrawSuccess={fetchWallet}
      />

      {/* ── Withdrawal History ── */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-clock-rotate-left text-[#A4860E]" />
          Withdrawal History
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No withdrawals requested yet. Click &quot;Withdraw Earnings&quot; above to transfer funds to your bank.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Bank Account</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-gray-900">
                        ₦{w.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <span className="font-semibold">{w.bankDetails?.bankName}</span> &bull;{" "}
                        <span className="font-mono">{w.bankDetails?.accountNumber}</span>{" "}
                        ({w.bankDetails?.accountName})
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(w.createdAt).toLocaleString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <i className="fa-solid fa-check text-[10px]" /> Disbursed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Delivered Orders & Lock Status ── */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-hourglass-half text-[#A4860E]" />
          Delivered Orders &amp; Payout Status
        </h2>
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No delivered orders found.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const releaseDate = order.sellerPayoutReleaseAt
                ? new Date(order.sellerPayoutReleaseAt)
                : null;
              const isEligible = releaseDate && releaseDate <= now;
              const remainingMs = releaseDate ? Math.max(0, releaseDate.getTime() - now.getTime()) : null;
              const hoursLeft = remainingMs !== null ? Math.floor(remainingMs / 3_600_000) : null;
              const minutesLeft =
                remainingMs !== null
                  ? Math.floor((remainingMs % 3_600_000) / 60_000)
                  : null;

              const progress =
                releaseDate && order.deliveredAt
                  ? Math.min(
                      100,
                      ((now.getTime() - new Date(order.deliveredAt).getTime()) /
                        (24 * 3_600_000)) *
                        100
                    )
                  : isEligible
                    ? 100
                    : 0;

              const borderClass =
                order.lockStatus === "held"
                  ? "border-amber-300 bg-amber-50/30"
                  : order.lockStatus === "paid"
                    ? "border-emerald-200"
                    : order.lockStatus === "available"
                      ? "border-emerald-300"
                      : "border-gray-100";

              return (
                <div
                  key={order._id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm ${borderClass}`}
                >
                  {/* Admin Hold Banner */}
                  {order.lockStatus === "held" && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                      <i className="fa-solid fa-lock text-amber-500 mt-0.5 text-base" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">
                          Payout Held by Admin
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                          {order.payoutHoldReason ||
                            "This payout is under review by the admin team. You will be notified once released."}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          <i className="fa-solid fa-envelope mr-1" />
                          A hold notification email has been sent to you.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-gray-400">
                        Order #{order._id.slice(-12).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Delivered:{" "}
                        <span className="font-medium text-gray-800">
                          {order.deliveredAt
                            ? new Date(order.deliveredAt).toLocaleString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </p>
                      {releaseDate && order.lockStatus === "pending" && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Unlocks:{" "}
                          <span className="font-medium text-gray-800">
                            {releaseDate.toLocaleString("en-NG", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-extrabold text-[#A4860E]">
                        ₦{order.netPayout.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400">Net payout (95%)</p>
                      <div className="mt-1.5">
                        {order.lockStatus === "paid" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <i className="fa-solid fa-check" /> Withdrawn
                          </span>
                        ) : order.lockStatus === "held" ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <i className="fa-solid fa-lock" /> Held by Admin
                          </span>
                        ) : order.lockStatus === "available" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                            <i className="fa-solid fa-unlock" /> Ready to Withdraw
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full">
                            <i className="fa-solid fa-hourglass-half" />
                            Locked ({hoursLeft}h {minutesLeft}m left)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar — only for pending (24h) orders */}
                  {order.lockStatus === "pending" && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Delivered</span>
                        <span className="font-medium">{Math.round(progress)}% of 24 hrs elapsed</span>
                        <span>Unlocks</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#A4860E] transition-all duration-500"
                          style={{ width: `${Math.round(progress)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
