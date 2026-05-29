"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PayoutOrder {
  _id: string;
  totalAmount: number;
  deliveredAt: string;
  sellerPayoutReleaseAt: string;
  sellerPaid: boolean;
  buyer: { name: string };
  items: { seller: { name: string; storeName?: string }; price: number; quantity: number }[];
}

export default function AdminPayoutsPage() {
  const [orders, setOrders] = useState<PayoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"eligible" | "paid" | "all">("eligible");
  const [releasing, setReleasing] = useState<string | null>(null);

  const fetchPayouts = () => {
    setLoading(true);
    fetch(`/api/admin/payouts?filter=${filter}`)
      .then((r) => r.json())
      .then((d) => { setOrders(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { fetchPayouts(); }, [filter]);

  const handleRelease = async (orderId: string) => {
    if (!confirm("Release payout for this order?")) return;
    setReleasing(orderId);
    await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    setReleasing(null);
    fetchPayouts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Payouts</h1>
          <p className="text-gray-500 text-sm mt-1">Release held payments to sellers after 3-day delivery period.</p>
        </div>
        <div className="flex gap-2">
          {(["eligible", "paid", "all"] as const).map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-32" size="lg" /> : (
        orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
            {filter === "eligible" ? "No payouts eligible for release yet." : "No orders found."}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-gray-400 mb-1">#{order._id.slice(-12).toUpperCase()}</p>
                    <p className="text-sm text-gray-600">
                      Buyer: <span className="font-medium text-gray-900">{order.buyer?.name}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Delivered: {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Release date: <span className="font-medium text-gray-800">
                        {order.sellerPayoutReleaseAt ? new Date(order.sellerPayoutReleaseAt).toLocaleDateString() : "—"}
                      </span>
                    </p>
                    <div className="mt-2 space-y-1">
                      {order.items?.map((item, i) => (
                        <p key={i} className="text-xs text-gray-500">
                          Seller: <span className="font-medium">{item.seller?.storeName || item.seller?.name}</span>
                          {" — "}₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-teal-700 mb-3">₦{order.totalAmount.toLocaleString()}</p>
                    {order.sellerPaid ? (
                      <span className="badge bg-teal-100 text-teal-700"><i className="fa-solid fa-check" /> Released</span>
                    ) : (
                      <button
                        onClick={() => handleRelease(order._id)}
                        disabled={releasing === order._id}
                        className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60 text-sm">
                        {releasing === order._id ? "Releasing..." : "Release Payout"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
