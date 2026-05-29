import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const session = await auth();
  await connectDB();

  const [userCount, productCount, orderCount, orders] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.find({ paymentStatus: "paid" }).lean(),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingPayouts = orders.filter(
    (o) => !o.sellerPaid && o.deliveredAt && o.sellerPayoutReleaseAt && o.sellerPayoutReleaseAt <= new Date()
  ).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 mt-1">Platform-wide statistics and management.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Users" value={userCount} color="teal"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard label="Total Products" value={productCount} color="gold"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard label="Total Orders" value={orderCount} color="blue"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>}
        />
        <StatCard label="GMV" value={`₦${totalRevenue.toLocaleString()}`} color="teal"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {pendingPayouts > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-yellow-800 font-medium">
            {pendingPayouts} order{pendingPayouts > 1 ? "s" : ""} ready for seller payout release.{" "}
            <a href="/dashboard/admin/payouts" className="underline">Review now →</a>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Manage Users", desc: "View, ban, or change roles for all users.", href: "/dashboard/admin/users", color: "bg-teal-600" },
          { title: "Manage Products", desc: "Review and moderate all listed products.", href: "/dashboard/admin/products", color: "bg-yellow-500" },
          { title: "Release Payouts", desc: "Approve seller payouts after 3-day hold.", href: "/dashboard/admin/payouts", color: "bg-blue-600" },
        ].map((card) => (
          <a key={card.href} href={card.href}
            className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 ${card.color} rounded-xl mb-4 flex items-center justify-center`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">{card.title}</h3>
            <p className="text-sm text-gray-500">{card.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
