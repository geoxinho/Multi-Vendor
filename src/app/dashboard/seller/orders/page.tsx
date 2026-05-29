"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  image: string;
  seller: string;
}

interface Order {
  _id: string;
  buyer: { name: string; email: string };
  items: OrderItem[];
  totalAmount: number;
  deliveryStatus: string;
  paymentStatus: string;
  shippingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  deliveryPin: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  delivered:  "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-purple-100 text-purple-700",
  paid:       "bg-green-100 text-green-700",
  pending:    "bg-yellow-100 text-yellow-700",
  failed:     "bg-red-100 text-red-700",
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setLoading(false); });
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleShip = async (id: string) => {
    await fetch(`/api/orders/${id}/ship`, { method: "PATCH" });
    fetchOrders();
  };

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Orders</h1>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Orders for your products will appear here." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-mono text-gray-400">#{order._id.slice(-12).toUpperCase()}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.buyer?.name}</p>
                  <p className="text-xs text-gray-400">{order.buyer?.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${STATUS_COLOR[order.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                    {order.paymentStatus}
                  </span>
                  <span className={`badge ${STATUS_COLOR[order.deliveryStatus] ?? "bg-gray-100 text-gray-600"}`}>
                    {order.deliveryStatus}
                  </span>
                </div>
              </div>
              
              {/* Buyer Contact & Delivery Details */}
              <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                    <i className="fa-solid fa-user text-gray-400" /> Buyer Contact
                  </p>
                  <div className="space-y-1 text-gray-600">
                    <p><span className="font-medium text-gray-400">Name:</span> {order.buyer?.name}</p>
                    <p><span className="font-medium text-gray-400">Email:</span> {order.buyer?.email}</p>
                    <p><span className="font-medium text-gray-400">Phone:</span> {order.shippingAddress?.phone || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                    <i className="fa-solid fa-location-dot text-gray-400" /> Delivery Address
                  </p>
                  <div className="space-y-0.5 text-gray-600">
                    <p className="font-semibold text-gray-800">{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.address}</p>
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                  </div>
                </div>
              </div>

              {/* Items with images */}
              <div className="space-y-3 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-green-700 shrink-0">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Security PIN Warning box */}
              {order.deliveryStatus !== "delivered" && order.paymentStatus === "paid" && (
                <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-900 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <i className="fa-solid fa-key text-amber-600" />
                      <span>Delivery Verification PIN:</span>
                    </div>
                    <span className="font-mono text-sm font-black px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-lg tracking-wider select-all border border-amber-200 self-start sm:self-auto">
                      {order.deliveryPin}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    <i className="fa-solid fa-triangle-exclamation" /> <strong>IMPORTANT FOR SELLER:</strong> You must <strong>NOT</strong> disclose this 6-digit PIN to the buyer until the package has been delivered and received successfully.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="font-bold text-green-700">Total: ₦{order.totalAmount.toLocaleString()}</span>
                {order.deliveryStatus === "processing" && order.paymentStatus === "paid" && (
                  <button
                    onClick={() => handleShip(order._id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Mark as Shipped
                  </button>
                )}
                {order.deliveryStatus === "shipped" && (
                  <span className="text-sm text-amber-600 font-semibold flex items-center gap-1">
                    <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Shipped (Awaiting Buyer Confirmation)
                  </span>
                )}
                {order.deliveryStatus === "delivered" && (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Delivered & Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
