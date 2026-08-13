"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDeliveryForm from "@/components/orders/ConfirmDeliveryForm";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  image: string;
  seller: string;
}

interface Order {
  _id: string;
  buyer: { _id: string; name: string; email: string };
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
  delivered:  "bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]",
  processing: "bg-amber-50 text-amber-700 border border-amber-200",
  shipped:    "bg-purple-50 text-purple-700 border border-purple-200",
  paid:       "bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]",
  pending:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
  failed:     "bg-red-50 text-red-700 border border-red-200",
};

export default function SellerOrdersPage() {
  const { data: session } = useSession();
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
                         <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                           <i className="fa-solid fa-image text-lg" />
                         </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                     <p className="text-sm font-bold text-[#A4860E] shrink-0">
                       ₦{(item.price * item.quantity).toLocaleString()}
                     </p>
                  </div>
                ))}
              </div>

              {/* Delivery PIN Input Form */}
              {order.deliveryStatus !== "delivered" && order.paymentStatus === "paid" && (
                <div className="mb-4">
                  <ConfirmDeliveryForm orderId={order._id} onSuccess={fetchOrders} />
                </div>
              )}

              {/* Message Buyer */}
              <div className="mb-4">
                 <Link 
                   href={`/dashboard/seller/messages?orderId=${order._id}`}
                   className="flex items-center gap-2 justify-center w-full bg-[#fdf8e8] border border-[#e8d48a] text-[#A4860E] py-2.5 rounded-xl font-bold hover:bg-[#fdf8e8]/50 transition-colors text-sm"
                 >
                   <i className="fa-solid fa-comment-dots text-sm" />
                   Message Buyer
                 </Link>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                 <span className="font-bold text-[#A4860E]">Total: ₦{order.totalAmount.toLocaleString()}</span>
                 {order.deliveryStatus === "processing" && order.paymentStatus === "paid" && (
                   <button
                     onClick={() => handleShip(order._id)}
                     className="px-4 py-2 bg-[#A4860E] hover:bg-[#8a7009] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                   >
                     Mark as Shipped
                   </button>
                 )}
                 {order.deliveryStatus === "shipped" && (
                   <span className="text-sm text-amber-600 font-semibold flex items-center gap-1">
                     <i className="fa-solid fa-clock animate-pulse" />
                     Shipped (Awaiting Buyer Confirmation)
                   </span>
                 )}
                 {order.deliveryStatus === "delivered" && (
                   <span className="text-sm text-[#A4860E] font-medium flex items-center gap-1">
                     <i className="fa-solid fa-circle-check" />
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
