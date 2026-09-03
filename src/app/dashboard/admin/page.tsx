import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { OrderReport } from "@/models/OrderReport";
import { SupportTicket } from "@/models/SupportTicket";
import { getAllActiveSchools, getCampusUserModel, getCampusProductModel } from "@/lib/campusModels";
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

  // ── Fetch user counts across all campus collections ──
  const activeSchools = await getAllActiveSchools();
  const userModels = activeSchools.map((s) => getCampusUserModel(s.slug));
  userModels.push(User); // include legacy

  const productModels = activeSchools.map((s) => getCampusProductModel(s.slug));
  productModels.push(Product);

  // Deduplicate by _id to avoid double-counting across campus + legacy collections
  const [userIdSets, productIdSets] = await Promise.all([
    Promise.all(
      userModels.map((m) =>
        m
          .find({})
          .select("_id")
          .lean()
          .then((docs: any[]) => docs.map((d) => d._id.toString()))
          .catch(() => [] as string[])
      )
    ),
    Promise.all(
      productModels.map((m) =>
        m
          .find({})
          .select("_id")
          .lean()
          .then((docs: any[]) => docs.map((d) => d._id.toString()))
          .catch(() => [] as string[])
      )
    ),
  ]);

  const uniqueUserIds = new Set(userIdSets.flat());
  const uniqueProductIds = new Set(productIdSets.flat());
  const userCount = uniqueUserIds.size;
  const productCount = uniqueProductIds.size;

  const activityCounts = await Promise.all(
    userModels.map((m) =>
      Promise.all([
        m
          .countDocuments({
            $or: [{ lastActiveAt: { $gte: d7 } }, { lastActiveAt: { $exists: false }, updatedAt: { $gte: d7 } }],
          })
          .catch(() => 0),
        m
          .countDocuments({
            $or: [
              { lastActiveAt: { $lt: d7, $gte: d30 } },
              { lastActiveAt: { $exists: false }, updatedAt: { $lt: d7, $gte: d30 } },
            ],
          })
          .catch(() => 0),
        m
          .countDocuments({
            $or: [
              { lastActiveAt: { $lt: d30, $gte: d90 } },
              { lastActiveAt: { $exists: false }, updatedAt: { $lt: d30, $gte: d90 } },
            ],
          })
          .catch(() => 0),
        m
          .countDocuments({
            $or: [{ lastActiveAt: { $lt: d90 } }, { lastActiveAt: { $exists: false }, updatedAt: { $lt: d90 } }],
          })
          .catch(() => 0),
      ])
    )
  );

  let activeUsersCount = 0;
  let inactive7dCount = 0;
  let inactive30dCount = 0;
  let inactive90dCount = 0;
  for (const [a, b, c, d] of activityCounts) {
    activeUsersCount += a;
    inactive7dCount += b;
    inactive30dCount += c;
    inactive90dCount += d;
  }

  const [orderCount, orders, lowStockProducts, pendingReportsCount, openTicketsCount, recentTickets] =
    await Promise.all([
      Order.countDocuments(),
      Order.find({ paymentStatus: "paid" }).lean(),
      Product.find({ status: "active", stock: { $lte: 3 } })
        .populate("seller", "name email storeName")
        .limit(10)
        .lean(),
      OrderReport.countDocuments({ status: "pending" }),
      SupportTicket.countDocuments({ status: "open" }),
      SupportTicket.find().sort("-createdAt").limit(5).lean(),
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

  const STATUS_STYLES: Record<string, string> = {
    open: "bg-red-50 text-red-700 border border-red-200",
    in_progress: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    resolved: "bg-green-50 text-green-700 border border-green-200",
    closed: "bg-gray-100 text-gray-500 border border-gray-200",
  };

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

        {openTicketsCount > 0 && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <i className="fa-solid fa-envelope-open-text" />
              </div>
              <div>
                <p className="text-sm font-bold text-purple-900">
                  {openTicketsCount} open support ticket{openTicketsCount > 1 ? "s" : ""} awaiting reply
                </p>
                <p className="text-xs text-purple-700 mt-0.5">
                  Users have sent help desk messages from the /help page that need your attention.
                </p>
              </div>
            </div>
            <Link href="/dashboard/admin/support" className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3.5 py-2 rounded-xl transition-colors shrink-0">
              View Messages &rarr;
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
          <Link href="/dashboard/admin/users" className="text-xs font-bold text-[#A4860E] hover:underline self-start sm:self-auto">
            View all users &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active (<7 days) */}
          <Link href="/dashboard/admin/users?activity=active" className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition group">
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
          <Link href="/dashboard/admin/users?activity=inactive_7d" className="p-4 rounded-xl border border-yellow-100 bg-yellow-50/40 hover:bg-yellow-50 hover:border-yellow-200 transition group">
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
          <Link href="/dashboard/admin/users?activity=inactive_30d" className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-200 transition group">
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
          <Link href="/dashboard/admin/users?activity=inactive_90d" className="p-4 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 hover:border-red-200 transition group">
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

      {/* ── Recent Support Messages ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-headset text-[#A4860E]" />
              Recent Support Messages
              {openTicketsCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
                  {openTicketsCount} open
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Messages submitted by users and visitors via the /help page.</p>
          </div>
          <Link href="/dashboard/admin/support" className="text-xs font-bold text-[#A4860E] hover:underline self-start sm:self-auto whitespace-nowrap">
            View all tickets &rarr;
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <i className="fa-solid fa-inbox text-4xl mb-3 block" />
            <p className="text-sm font-medium">No support messages yet</p>
            <p className="text-xs mt-1">Messages from the /help page will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTickets.map((ticket: any) => (
              <div key={ticket._id.toString()} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-user text-purple-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{ticket.name}</span>
                    <span className="text-gray-400 text-xs">·</span>
                    <a href={`mailto:${ticket.email}`} className="text-xs text-[#A4860E] hover:underline">{ticket.email}</a>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[ticket.status] || "bg-gray-100 text-gray-500"}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{ticket.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ticket.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {ticket.ticketId} · {ticket.category}
                    {ticket.orderId ? ` · Order #${ticket.orderId}` : ""}
                    · {new Date(ticket.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Manage Users", desc: "View, ban, or filter by user activity status.", href: "/dashboard/admin/users", color: "bg-teal-600", icon: "fa-users" },
          { title: "Campuses & Schools", desc: "Manage universities & polytechnics.", href: "/dashboard/admin/schools", color: "bg-[#A4860E]", icon: "fa-graduation-cap" },
          { title: "Complaints & Reports", desc: "Resolve delivery & order disputes.", href: "/dashboard/admin/reports", color: "bg-rose-600", icon: "fa-triangle-exclamation" },
          { title: "Support Messages", desc: "Read & respond to user help desk tickets.", href: "/dashboard/admin/support", color: "bg-purple-600", icon: "fa-headset" },
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
