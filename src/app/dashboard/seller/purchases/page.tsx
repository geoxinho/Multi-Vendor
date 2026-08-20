"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";

interface OrderItem {
  title: string;
  quantity: number;
  image: string;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  paid:        "bg-green-100 text-green-700",
  pending:     "bg-yellow-100 text-yellow-700",
  failed:      "bg-red-100 text-red-700",
  delivered:   "bg-[#fdf8e8] text-[#A4860E]",
  processing:  "bg-blue-100 text-blue-700",
  shipped:     "bg-purple-100 text-purple-700",
};

export default function SellerPurchasesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // asBuyer=true → returns orders where this seller is the buyer
    fetch("/api/orders?asBuyer=true")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setLoading(false); });
  }, []);

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Purchases</h1>
          <p className="text-sm text-gray-500 mt-1">
            Products you&apos;ve bought from other sellers on CampusGo.
          </p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#A4860E] hover:bg-[#8a7009] text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <i className="fa-solid fa-bag-shopping text-xs" />
          Shop Now
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          description="You haven't bought any products from other sellers yet. Browse the marketplace to find something you like."
          action={
            <Link
              href="/products"
              className="px-6 py-2.5 bg-[#A4860E] text-white font-semibold rounded-xl hover:bg-[#8a7009] transition-colors"
            >
              Browse Products
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Order header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F5F5F5] bg-gray-50/50">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-mono text-gray-400">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_COLOR[order.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                    <i className="fa-solid fa-credit-card text-[9px]" />
                    {order.paymentStatus}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_COLOR[order.deliveryStatus] ?? "bg-gray-100 text-gray-600"}`}>
                    <i className="fa-solid fa-truck text-[9px]" />
                    {order.deliveryStatus}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/dashboard/buyer/orders/${order._id}`}
                    className="text-xs font-semibold text-[#A4860E] hover:underline flex items-center gap-1"
                  >
                    View details
                    <i className="fa-solid fa-arrow-right text-[9px]" />
                  </Link>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-[#F5F5F5]">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <i className="fa-solid fa-image" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-[#A4860E] shrink-0">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#F5F5F5] bg-gray-50/30">
                <span className="text-xs text-gray-500">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  Total: <span className="text-[#A4860E]">₦{order.totalAmount.toLocaleString()}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
