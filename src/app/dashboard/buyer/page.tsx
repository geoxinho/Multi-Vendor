import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Buyer Dashboard" };

export default async function BuyerDashboardPage() {
  const session = await auth();
  await connectDB();

  const orders = await Order.find({ buyer: session!.user.id }).lean();
  const totalSpent = orders.filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const delivered = orders.filter((o) => o.deliveryStatus === "delivered").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {session!.user.name}! <i className="fa-solid fa-hand-wave text-yellow-400" /></h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Orders"
          value={orders.length}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
        />
        <StatCard
          label="Total Spent"
          value={`₦${totalSpent.toLocaleString()}`}
          color="gold"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Delivered"
          value={delivered}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
        <Link href="/dashboard/buyer/orders" className="text-sm text-green-600 hover:underline">View all</Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="mt-4 inline-block px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Order ID", "Items", "Total", "Payment", "Delivery", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.slice(0, 5).map((order) => (
                <tr key={order._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{order._id.toString().slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-gray-700">{order.items.length} item(s)</td>
                  <td className="px-4 py-3 font-semibold text-green-700">₦{order.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${order.deliveryStatus === "delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {order.deliveryStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
