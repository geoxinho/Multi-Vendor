"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Order {
  _id: string;
  buyer?: { name: string; email: string; phone?: string };
  totalAmount: number;
  platformFee: number;
  netPayout: number;
  paymentStatus: "pending" | "paid" | "failed";
  deliveryStatus: "processing" | "shipped" | "delivered" | "cancelled";
  sellerPaid: boolean;
  payoutHeld: boolean;
  createdAt: string;
  items: {
    _id: string;
    title: string;
    image: string;
    quantity: number;
    price: number;
    seller?: { storeName?: string; name?: string; email?: string };
  }[];
}

const statusColor: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/orders?limit=100")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.items?.some((i) =>
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.seller?.storeName?.toLowerCase().includes(search.toLowerCase()) ||
        i.seller?.name?.toLowerCase().includes(search.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "paid") return o.paymentStatus === "paid";
    if (statusFilter === "processing") return o.deliveryStatus === "processing";
    if (statusFilter === "shipped") return o.deliveryStatus === "shipped";
    if (statusFilter === "delivered") return o.deliveryStatus === "delivered";
    if (statusFilter === "held") return o.payoutHeld;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track customer orders, delivery verification, and seller payouts</p>
        </div>

        <input
          type="text"
          placeholder="Search buyer, order ID, seller, or item…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] w-72 bg-white"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: "all", label: "All Orders" },
          { id: "processing", label: "Processing" },
          { id: "shipped", label: "Shipped" },
          { id: "delivered", label: "Delivered" },
          { id: "paid", label: "Paid" },
          { id: "held", label: "Payout Held" },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#A4860E] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner className="py-32" size="lg" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[840px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Order", "Buyer", "Items & Seller", "Total", "Payment", "Delivery", "Payout", "Date", "Action"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => {
                  const firstItem = order.items?.[0];
                  return (
                    <tr key={order._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Order ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/dashboard/admin/orders/${order._id}`}
                          className="font-mono text-xs font-bold text-[#A4860E] hover:underline"
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>

                      {/* Buyer */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 text-xs">{order.buyer?.name || "Anonymous"}</p>
                        <p className="text-gray-400 text-[11px]">{order.buyer?.email}</p>
                      </td>

                      {/* Items & Seller Preview */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {firstItem?.image ? (
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              <Image src={firstItem.image} alt="" fill className="object-cover" sizes="36px" />
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-xs truncate max-w-[170px]">
                              {firstItem?.title || "Product"}
                              {order.items.length > 1 ? ` (+${order.items.length - 1} more)` : ""}
                            </p>
                            {firstItem?.seller && (
                              <p className="text-[11px] text-gray-400 truncate max-w-[170px]">
                                Store: <span className="text-gray-600 font-medium">{firstItem.seller.storeName || firstItem.seller.name}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                        ₦{order.totalAmount?.toLocaleString()}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-bold border capitalize ${statusColor[order.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Delivery */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-bold border capitalize ${statusColor[order.deliveryStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {order.deliveryStatus}
                        </span>
                      </td>

                      {/* Payout */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-[11px] rounded-full font-bold border ${
                          order.sellerPaid
                            ? "bg-green-100 text-green-700 border-green-200"
                            : order.payoutHeld
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}>
                          {order.sellerPaid ? "Disbursed" : order.payoutHeld ? "Held" : "Pending"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "short" })}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/dashboard/admin/orders/${order._id}`}
                          className="px-3 py-1.5 bg-[#fdf8e8] hover:bg-[#f6ebc4] text-[#A4860E] border border-[#e8d48a] font-bold text-xs rounded-lg transition-colors inline-block"
                        >
                          View Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-gray-400">
                      <i className="fa-solid fa-receipt text-4xl mb-3 text-gray-300 block" />
                      No orders found under this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

