import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { OrderReport } from "@/models/OrderReport";
import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const session = await auth();
  await connectDB();

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    userCount,
    productCount,
    orderCount,
    orders,
    lowStockProducts,
    activeUsersCount,
    inactive7dCount,
    inactive30dCount,
    inactive90dCount,
    pendingReportsCount,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.find({ paymentStatus: "paid" }).lean(),
    Product.find({ status: "active", stock: { $lte: 3 } })
      .populate("seller", "name email storeName")
      .limit(10)
      .lean(),
    User.countDocuments({
      $or: [
        { lastActiveAt: { $gte: d7 } },
        { lastActiveAt: { $exists: false }, updatedAt: { $gte: d7 } },
      ],
    }),
    User.countDocuments({
      $or: [
        { lastActiveAt: { $lt: d7, $gte: d30 } },
        { lastActiveAt: { $exists: false }, updatedAt: { $lt: d7, $gte: d30 } },
      ],
    }),
    User.countDocuments({
      $or: [
        { lastActiveAt: { $lt: d30, $gte: d90 } },
        { lastActiveAt: { $exists: false }, updatedAt: { $lt: d30, $gte: d90 } },
      ],
    }),
    User.countDocuments({
      $or: [
        { lastActiveAt: { $lt: d90 } },
        { lastActiveAt: { $exists: false }, updatedAt: { $lt: d90 } },
      ],
    }),
    OrderReport.countDocuments({ status: "pending" }),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingPayouts = orders.filter(
    (o) => !o.sellerPaid && o.deliveredAt && o.sellerPayoutReleaseAt && o.sellerPayoutReleaseAt <= new Date()
  ).length;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";

  const totalUsersSafe = userCount || 1;
  const activePercent = Math.round((activeUsersCount / totalUsersSafe) * 100);
  const inactive7dPercent = Math.round((inactive7dCount / totalUsersSafe) * 100);
  const inactive30dPercent = Math.round((inactive30dCount / totalUsersSafe) * 100);
  const inactive90dPercent = Math.round((inactive90dCount / totalUsersSafe) * 100);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <span>{greeting}, {session?.user?.name || "Admin"}!</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Platform-wide statistics, user retention, and management.</p>
      </div>

      {/* Inventory Warnings for Admin */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 bg-[#FFF5F5] border border-[#FED7D7]/60 rounded-xl p-5 shadow-[0_2px_8px_rgba(220,38,38,0.02)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] border border-[#FCA5A5]/40 text-sm">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <h3 className="font-bold text-[#9B2C2C] text-sm">Inventory Stock Warnings</h3>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-[#FED7D7]/40 pr-2">
            {lowStockProducts.map((p: any) => (
              <div key={p._id.toString()} className="flex justify-between items-center text-xs pt-2 first:pt-0">
                <div>
                  <span className="font-bold text-gray-900 text-sm">{p.title}</span>
                  <span className="text-[#6B6B6B] block mt-0.5">
                    Seller: <span className="font-medium text-[#111111]">{p.seller?.storeName || p.seller?.name || "Unknown"}</span> ({p.seller?.email || "N/A"})
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider ${p.stock === 0 ? "bg-[#FFF5F5] text-[#DC2626] border border-[#FED7D7]" : "bg-[#FFF7ED] text-[#D97706] border border-[#FFEDD5]"}`}>
                  {p.stock === 0 ? "Out of Stock" : `Low Stock: ${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={userCount} color="green"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard label="Total Products" value={productCount} color="gold"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard label="Total Orders" value={orderCount} color="blue"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>}
        />
        <StatCard label="GMV" value={`₦${totalRevenue.toLocaleString()}`} color="green"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Alerts */}
      <div className="space-y-4 mb-8">
        {pendingPayouts > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800 font-medium">
                {pendingPayouts} order{pendingPayouts > 1 ? "s" : ""} ready for seller payout release.
              </p>
            </div>
            <Link href="/dashboard/admin/payouts" className="text-xs font-bold text-yellow-900 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors">
              Review payouts &rarr;
            </Link>
          </div>
        )}

        {pendingReportsCount > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">
                  {pendingReportsCount} unresolved order complaint{pendingReportsCount > 1 ? "s" : ""} reported
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Buyers and sellers have flagged delivery abnormalities requiring administrative review.
                </p>
              </div>
            </div>
            <Link href="/dashboard/admin/reports" className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-xl transition-colors shrink-0">
              Inspect Complaints &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* ── User Activity & Retention Analytics Section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-users-gear text-[#A4860E]" />
              User Activity &amp; Retention Tracking
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live segmentation based on user session activity, login timestamps, and account engagement.
            </p>
          </div>
          <Link
            href="/dashboard/admin/users"
            className="text-xs font-bold text-[#A4860E] hover:underline self-start sm:self-auto"
          >
            View all users &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active (<7 days) */}
          <Link
            href="/dashboard/admin/users?activity=active"
            className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Users</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-emerald-900">{activeUsersCount}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700">
              <span>Active in last 7 days</span>
              <span className="font-bold">{activePercent}%</span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${activePercent}%` }} />
            </div>
          </Link>

          {/* Inactive 7-30 days */}
          <Link
            href="/dashboard/admin/users?activity=inactive_7d"
            className="p-4 rounded-xl border border-yellow-100 bg-yellow-50/40 hover:bg-yellow-50 hover:border-yellow-200 transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Inactive 7+ Days</span>
              <i className="fa-solid fa-clock-rotate-left text-yellow-600 text-xs" />
            </div>
            <p className="text-2xl font-black text-yellow-900">{inactive7dCount}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-yellow-700">
              <span>7 – 30 days inactive</span>
              <span className="font-bold">{inactive7dPercent}%</span>
            </div>
            <div className="w-full bg-yellow-200/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${inactive7dPercent}%` }} />
            </div>
          </Link>

          {/* Inactive 30-90 days */}
          <Link
            href="/dashboard/admin/users?activity=inactive_30d"
            className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-200 transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Inactive 30+ Days</span>
              <i className="fa-solid fa-calendar-xmark text-amber-600 text-xs" />
            </div>
            <p className="text-2xl font-black text-amber-900">{inactive30dCount}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-amber-700">
              <span>30 – 90 days inactive</span>
              <span className="font-bold">{inactive30dPercent}%</span>
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${inactive30dPercent}%` }} />
            </div>
          </Link>

          {/* Inactive >90 days */}
          <Link
            href="/dashboard/admin/users?activity=inactive_90d"
            className="p-4 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 hover:border-red-200 transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Inactive &gt;90 Days</span>
              <i className="fa-solid fa-user-slash text-red-600 text-xs" />
            </div>
            <p className="text-2xl font-black text-red-900">{inactive90dCount}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-red-700">
              <span>More than 90 days</span>
              <span className="font-bold">{inactive90dPercent}%</span>
            </div>
            <div className="w-full bg-red-200/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${inactive90dPercent}%` }} />
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Manage Users", desc: "View, ban, or filter by user activity status.", href: "/dashboard/admin/users", color: "bg-teal-600", icon: "fa-users" },
          { title: "Campuses & Schools", desc: "Manage universities & polytechnics.", href: "/dashboard/admin/schools", color: "bg-[#A4860E]", icon: "fa-graduation-cap" },
          { title: "Complaints & Reports", desc: "Resolve delivery & order disputes.", href: "/dashboard/admin/reports", color: "bg-rose-600", icon: "fa-triangle-exclamation" },
          { title: "Release Payouts", desc: "Approve seller payouts after 24-hour hold.", href: "/dashboard/admin/payouts", color: "bg-blue-600", icon: "fa-money-bill-transfer" },
        ].map((card) => (
          <Link key={card.href} href={card.href}
            className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 ${card.color} rounded-xl mb-4 flex items-center justify-center text-white text-base`}>
              <i className={`fa-solid ${card.icon}`} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#A4860E] transition-colors">{card.title}</h3>
            <p className="text-xs text-gray-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
