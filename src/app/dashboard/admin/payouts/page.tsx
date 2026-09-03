"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PayoutOrder {
  _id: string;
  totalAmount: number;
  netPayout: number;
  deliveredAt: string;
  sellerPayoutReleaseAt: string;
  sellerPaid: boolean;
  payoutHeld: boolean;
  payoutHoldReason?: string;
  buyer: { name: string; school?: string };
  items: {
    seller: { name: string; storeName?: string; school?: string };
    price: number;
    quantity: number;
    netPayout?: number;
  }[];
}

type FilterType = "pending" | "held" | "paid" | "all";

export default function AdminPayoutsPage() {
  const [orders, setOrders] = useState<PayoutOrder[]>([]);
  const [schools, setSchools] = useState<{ _id: string; name: string; code?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [actioning, setActioning] = useState<string | null>(null);
  // Hold dialog state
  const [holdTarget, setHoldTarget] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState("");

  const fetchPayouts = () => {
    setLoading(true);
    const params = new URLSearchParams({ filter });
    if (schoolFilter !== "all") params.set("school", schoolFilter);

    fetch(`/api/admin/payouts?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch("/api/schools?all=true")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setSchools(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, schoolFilter]);

  const handleHold = async () => {
    if (!holdTarget) return;
    setActioning(holdTarget);
    await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: holdTarget, action: "hold", reason: holdReason }),
    });
    setActioning(null);
    setHoldTarget(null);
    setHoldReason("");
    fetchPayouts();
  };

  const handleReleaseHold = async (orderId: string) => {
    if (!confirm("Release the hold on this payout? The cron job will process it automatically.")) return;
    setActioning(orderId);
    await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "release_hold" }),
    });
    setActioning(null);
    fetchPayouts();
  };

  const filters: FilterType[] = ["pending", "held", "paid", "all"];
  const filterLabels: Record<FilterType, string> = {
    pending: "Pending",
    held: "Held",
    paid: "Paid Out",
    all: "All",
  };

  return (
    <div>
      {/* ── Hold Reason Dialog ── */}
      {holdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              <i className="fa-solid fa-lock text-amber-500 mr-2" />
              Hold Payout
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Provide a reason for holding this payout. The seller will be notified by email.
            </p>
            <textarea
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="e.g. Transaction under review due to buyer dispute..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none h-24 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setHoldTarget(null); setHoldReason(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleHold}
                disabled={actioning === holdTarget}
                className="px-5 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {actioning === holdTarget ? "Holding..." : "Hold Payout & Notify Seller"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Payouts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Payouts release automatically 24 hrs after delivery. You can hold a payout before it releases.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white font-medium text-gray-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E]"
          >
            <option value="all">All Campuses</option>
            {schools.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name} {s.code ? `(${s.code})` : ""}
              </option>
            ))}
          </select>

          <div className="flex gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === f
                    ? f === "held"
                      ? "bg-amber-500 text-white"
                      : "bg-[#A4860E] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#A4860E]/50"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Order List ── */}
      {loading ? (
        <LoadingSpinner className="py-32" size="lg" />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
          {filter === "pending"
            ? "No payouts pending automatic release."
            : filter === "held"
              ? "No payouts currently on hold."
              : "No orders found."}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            // Calculate net payout for display
            const net = order.items.reduce(
              (s, i) => s + (i.netPayout ?? i.price * i.quantity * 0.95),
              0,
            );
            const orderSchool = order.buyer?.school || order.items?.[0]?.seller?.school || "General";

            return (
              <div
                key={order._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm ${
                  order.payoutHeld ? "border-amber-300" : "border-gray-100"
                }`}
              >
                {order.payoutHeld && order.payoutHoldReason && (
                  <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                    <i className="fa-solid fa-circle-info text-amber-500 mt-0.5 text-sm" />
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">Hold reason:</span> {order.payoutHoldReason}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-mono text-gray-400">
                        #{order._id.slice(-12).toUpperCase()}
                      </p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]">
                        <i className="fa-solid fa-graduation-cap text-[9px]" />
                        {orderSchool}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Buyer:{" "}
                      <span className="font-medium text-gray-900">{order.buyer?.name}</span>
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
                    <p className="text-sm text-gray-500">
                      Auto-release:{" "}
                      <span className="font-medium text-gray-800">
                        {order.sellerPayoutReleaseAt
                          ? new Date(order.sellerPayoutReleaseAt).toLocaleString("en-NG", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </p>
                    <div className="mt-2 space-y-0.5">
                      {order.items?.map((item, i) => (
                        <p key={i} className="text-xs text-gray-500">
                          Seller:{" "}
                          <span className="font-medium">
                            {item.seller?.storeName || item.seller?.name}
                          </span>
                          {" — "}
                          <span className="text-[#A4860E] font-semibold">
                            ₦{(item.netPayout ?? item.price * item.quantity * 0.95).toLocaleString()}
                          </span>
                          <span className="text-gray-400"> net</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-2">
                    <p className="text-2xl font-bold text-[#A4860E]">
                      ₦{Math.round(net).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">net payout (95%)</p>

                    {order.sellerPaid ? (
                      <span className="badge bg-emerald-100 text-emerald-700">
                        <i className="fa-solid fa-check mr-1" />
                        Paid Out
                      </span>
                    ) : order.payoutHeld ? (
                      <button
                        onClick={() => handleReleaseHold(order._id)}
                        disabled={actioning === order._id}
                        className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60 text-sm flex items-center gap-2"
                      >
                        <i className="fa-solid fa-lock-open" />
                        {actioning === order._id ? "Releasing..." : "Release Hold"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setHoldTarget(order._id)}
                        disabled={actioning === order._id}
                        className="px-4 py-2 bg-amber-50 border border-amber-300 text-amber-700 font-semibold rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-60 text-sm flex items-center gap-2"
                      >
                        <i className="fa-solid fa-lock" />
                        Hold Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
