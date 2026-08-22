"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
  netPayout?: number;
  seller: string;
}

interface Order {
  _id: string;
  totalAmount: number;
  deliveredAt: string;
  sellerPayoutReleaseAt: string;
  sellerPaid: boolean;
  payoutHeld: boolean;
  payoutHoldReason?: string;
  items: OrderItem[];
}

export default function SellerPayoutsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        const delivered = (d.orders ?? []).filter((o: Order) => o.deliveredAt);
        setOrders(delivered);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  const now = new Date();

  // Summary totals
  const totalPaidOut = orders
    .filter((o) => o.sellerPaid)
    .reduce((s, o) => s + o.items.reduce((ss, i) => ss + (i.netPayout ?? i.price * i.quantity * 0.95), 0), 0);

  const totalPending = orders
    .filter((o) => !o.sellerPaid)
    .reduce((s, o) => s + o.items.reduce((ss, i) => ss + (i.netPayout ?? i.price * i.quantity * 0.95), 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Payout Schedule</h1>
      <p className="text-gray-500 text-sm mb-6">
        Payouts are released automatically 24 hours after delivery confirmation. 5% platform fee is deducted.
      </p>

      {/* Summary */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-emerald-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Total Paid Out
            </p>
            <p className="text-2xl font-extrabold text-emerald-600">
              ₦{Math.round(totalPaidOut).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">After 5% fee</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e8d48a] p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Pending Payout
            </p>
            <p className="text-2xl font-extrabold text-[#A4860E]">
              ₦{Math.round(totalPending).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Awaiting 24 hr release</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          No delivered orders yet.
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

            const netAmount = order.items.reduce(
              (s, i) => s + (i.netPayout ?? i.price * i.quantity * 0.95),
              0,
            );

            // Progress: 0 → 100% over 24 hours
            const progress =
              releaseDate && order.deliveredAt
                ? Math.min(
                    100,
                    ((now.getTime() - new Date(order.deliveredAt).getTime()) / (24 * 3_600_000)) *
                      100,
                  )
                : isEligible
                  ? 100
                  : 0;

            return (
              <div
                key={order._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm ${
                  order.payoutHeld
                    ? "border-amber-300"
                    : order.sellerPaid
                      ? "border-emerald-200"
                      : "border-gray-100"
                }`}
              >
                {order.payoutHeld && (
                  <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                    <i className="fa-solid fa-lock text-amber-500 text-xs mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Payout on Hold</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {order.payoutHoldReason ||
                          "Admin is reviewing your transaction. No action required."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-gray-400">
                      #{order._id.slice(-12).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Delivered:{" "}
                      {order.deliveredAt
                        ? new Date(order.deliveredAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    {releaseDate && !order.sellerPaid && (
                      <p className="text-sm text-gray-500">
                        Auto-release:{" "}
                        <span className="font-medium text-gray-900">
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
                      ₦{Math.round(netAmount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">net payout (95%)</p>
                    <div className="mt-1">
                      {order.sellerPaid ? (
                        <span className="badge bg-emerald-100 text-emerald-700">
                          <i className="fa-solid fa-check mr-1" />
                          Paid Out
                        </span>
                      ) : order.payoutHeld ? (
                        <span className="badge bg-amber-100 text-amber-700">
                          <i className="fa-solid fa-lock mr-1" />
                          On Hold
                        </span>
                      ) : isEligible ? (
                        <span className="badge bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]">
                          <i className="fa-solid fa-circle-notch animate-spin mr-1" />
                          Processing…
                        </span>
                      ) : (
                        <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                          <i className="fa-solid fa-hourglass-half mr-1" />
                          {hoursLeft}h {minutesLeft}m left
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {!order.sellerPaid && (
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Delivered</span>
                      <span className="font-medium">{Math.round(progress)}% of 24 hrs</span>
                      <span>Payout Released</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          order.payoutHeld
                            ? "bg-amber-400"
                            : isEligible
                              ? "bg-emerald-500"
                              : "bg-[#A4860E]"
                        }`}
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
  );
}
