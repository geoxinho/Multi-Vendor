"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDeliveryForm from "@/components/orders/ConfirmDeliveryForm";

interface OrderItem {
  title: string;
  quantity: number;
  image: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  createdAt: string;
  deliveryPin?: string;
}

const STATUS_COLOR: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  delivered: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
};

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setLoading(false); });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once you place an order, it will appear here."
          action={
            <Link href="/products"
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-mono">#{order._id.slice(-12).toUpperCase()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${STATUS_COLOR[order.paymentStatus]}`}>{order.paymentStatus}</span>
                  <span className={`badge ${STATUS_COLOR[order.deliveryStatus]}`}>{order.deliveryStatus}</span>
                </div>
              </div>

              {/* Product image thumbnails + names */}
              <div className="flex items-center gap-3 mb-4">
                {/* Stacked thumbnails (max 4) */}
                <div className="flex -space-x-2">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div
                      key={i}
                      className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-gray-100 shrink-0 shadow-sm"
                      style={{ zIndex: order.items.length - i }}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="relative w-12 h-12 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                {/* Item names */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {order.items.map((item, i) => (
                      <span key={i}>
                        {item.title} <span className="text-gray-400">×{item.quantity}</span>
                        {i < order.items.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              {order.paymentStatus === "paid" && order.deliveryStatus !== "delivered" && order.deliveryPin && (
                <div className="mt-3 mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold flex items-center gap-1">
                      <i className="fa-solid fa-key text-amber-600" />
                      <span>Delivery OTP / PIN Code:</span>
                    </p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Provide this code to the seller ONLY after physically receiving your package.</p>
                  </div>
                  <span className="font-mono text-sm font-black px-2.5 py-1 bg-amber-100 border border-amber-200 text-amber-900 rounded-lg tracking-wider select-all shrink-0">
                    {order.deliveryPin}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="font-bold text-green-700 text-lg">₦{order.totalAmount.toLocaleString()}</span>
                <Link
                  href={`/dashboard/buyer/orders/${order._id}`}
                  className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline transition-colors"
                >
                  View details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
