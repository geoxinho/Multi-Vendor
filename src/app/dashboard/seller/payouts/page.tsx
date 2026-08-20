"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Order {
  _id: string;
  totalAmount: number;
  deliveredAt: string;
  sellerPayoutReleaseAt: string;
  sellerPaid: boolean;
  items: { title: string; price: number; quantity: number; seller: string }[];
}

export default function SellerPayoutsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        const delivered = (d.orders ?? []).filter(
          (o: Order) => o.deliveredAt
        );
        setOrders(delivered);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payout Schedule</h1>
      <p className="text-gray-500 text-sm mb-8">Payouts are released 24 hours after delivery confirmation.</p>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          No delivered orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const releaseDate = order.sellerPayoutReleaseAt ? new Date(order.sellerPayoutReleaseAt) : null;
            const isEligible = releaseDate && releaseDate <= now;
            const daysLeft = releaseDate
              ? Math.max(0, Math.ceil((releaseDate.getTime() - now.getTime()) / 86400000))
              : null;

            return (
              <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-gray-400">#{order._id.slice(-12).toUpperCase()}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Delivered: {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : "—"}
                    </p>
                    {releaseDate && (
                      <p className="text-sm text-gray-500">
                        Payout date: <span className="font-medium text-gray-900">{releaseDate.toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-teal-700">₦{order.totalAmount.toLocaleString()}</p>
                    {order.sellerPaid ? (
                      <span className="badge bg-teal-100 text-teal-700">Paid Out</span>
                    ) : isEligible ? (
                      <span className="badge bg-yellow-100 text-yellow-700">Eligible — Pending Admin</span>
                    ) : (
                      <span className="badge bg-blue-100 text-blue-700">
                        {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {!order.sellerPaid && releaseDate && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Delivered</span>
                      <span>Payout Released</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, isEligible ? 100 : (1 - (daysLeft ?? 0) / 3) * 100)}%`,
                        }}
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
