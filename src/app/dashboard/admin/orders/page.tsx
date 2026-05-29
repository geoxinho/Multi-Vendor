"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Order {
  _id: string;
  buyer: { name: string; email: string };
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  sellerPaid: boolean;
  createdAt: string;
  items: { title: string; quantity: number }[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setLoading(false); });
  }, []);

  const statusColor: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    delivered: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">All Orders</h1>

      {loading ? <LoadingSpinner className="py-32" size="lg" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Order ID", "Buyer", "Items", "Total", "Payment", "Delivery", "Payout", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{order._id.slice(-10).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-xs">{order.buyer?.name}</p>
                    <p className="text-gray-400 text-xs">{order.buyer?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{order.items?.length ?? 0} item(s)</td>
                  <td className="px-4 py-3 font-semibold text-green-700">₦{order.totalAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColor[order.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColor[order.deliveryStatus] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.deliveryStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${order.sellerPaid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {order.sellerPaid ? "Released" : "Held"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-10 text-center text-gray-400">No orders yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
