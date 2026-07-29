import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seller Dashboard" };

type OrderItem = {
  seller?: { toString(): string };
  price: number;
  quantity: number;
};

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user) notFound();
  await connectDB();

  const [products, orders] = await Promise.all([
    Product.find({ seller: session!.user.id }).lean(),
    Order.find({
      "items.seller": session!.user.id,
      paymentStatus: "paid",
    }).lean(),
  ]);

  const revenue = orders.reduce((sum, o) => {
    const sellerItems = o.items.filter(
      (i: OrderItem) => i.seller?.toString() === session!.user.id,
    );
    return (
      sum +
      sellerItems.reduce(
        (s: number, i: OrderItem) => s + i.price * i.quantity,
        0,
      )
    );
  }, 0);

  const pendingPayout = orders
    .filter(
      (o) =>
        !o.sellerPaid &&
        o.deliveryStatus === "delivered" &&
        o.sellerPayoutReleaseAt &&
        o.sellerPayoutReleaseAt <= new Date(),
    )
    .reduce((sum, o) => {
      const sellerItems = o.items.filter(
        (i: OrderItem) => i.seller?.toString() === session!.user.id,
      );
      return (
        sum +
        sellerItems.reduce(
          (s: number, i: OrderItem) => s + i.price * i.quantity,
          0,
        )
      );
    }, 0);

  const newOrdersCount = orders.filter((o) => o.deliveryStatus === "processing").length;
  const undeliveredCount = orders.filter((o) => o.deliveryStatus !== "delivered").length;
  const lowStockAlerts = products.filter((p) => p.status === "active" && p.stock <= 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage your store and track performance.
          </p>
        </div>
        <Link
          href="/dashboard/seller/products/new"
          className="px-5 py-2.5 bg-[#2563EB] text-white font-bold rounded-md hover:bg-[#1D4ED8] transition-colors text-sm shadow-sm"
        >
          + New Product
        </Link>
      </div>

      {/* Seller Notifications */}
      {(newOrdersCount > 0 || undeliveredCount > 0 || lowStockAlerts.length > 0) && (
        <div className="mb-8 space-y-3">
          {newOrdersCount > 0 && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE]/60 rounded-xl p-4 flex items-center justify-between shadow-[0_2px_8px_rgba(37,99,235,0.03)] animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] border border-[#BFDBFE]/40">
                  <i className="fa-solid fa-bell text-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1E40AF]">New Orders Received</h4>
                  <p className="text-xs text-[#2563EB] mt-0.5">You have {newOrdersCount} new order{newOrdersCount > 1 ? "s" : ""} awaiting processing.</p>
                </div>
              </div>
              <Link href="/dashboard/seller/orders" className="text-xs font-bold text-[#2563EB] bg-white border border-[#BFDBFE] hover:bg-[#EFF6FF] px-3.5 py-2 rounded-md transition-colors shadow-sm">
                Process Orders
              </Link>
            </div>
          )}

          {undeliveredCount > 0 && (
            <div className="bg-[#FFF7ED] border border-[#FFEDD5]/60 rounded-xl p-4 flex items-center justify-between shadow-[0_2px_8px_rgba(217,119,6,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FFE4E6]/10 bg-[#FFEDD5] flex items-center justify-center text-[#D97706] border border-[#FEF3C7]/40">
                  <i className="fa-solid fa-truck-fast text-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#9A3412]">Undelivered Orders</h4>
                  <p className="text-xs text-[#9A3412] mt-0.5">You have {undeliveredCount} order{undeliveredCount > 1 ? "s" : ""} that {undeliveredCount === 1 ? "has" : "have"} not been delivered to buyers yet.</p>
                </div>
              </div>
              <Link href="/dashboard/seller/orders" className="text-xs font-bold text-[#D97706] bg-white border border-[#FFEDD5] hover:bg-[#FFFBEB] px-3.5 py-2 rounded-md transition-colors shadow-sm">
                View Deliveries
              </Link>
            </div>
          )}

          {lowStockAlerts.length > 0 && (
            <div className="bg-[#FFF5F5] border border-[#FED7D7]/60 rounded-xl p-4 shadow-[0_2px_8px_rgba(220,38,38,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] border border-[#FCA5A5]/40">
                  <i className="fa-solid fa-triangle-exclamation text-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#9B2C2C]">Inventory Alert</h4>
                  <p className="text-xs text-[#9B2C2C] mt-0.5">
                    {lowStockAlerts.length} of your active product{lowStockAlerts.length > 1 ? "s are" : " is"} out of stock or running low (3 or less remaining).
                  </p>
                </div>
              </div>
              <Link href="/dashboard/seller/products" className="text-xs font-bold text-[#DC2626] bg-white border border-[#FED7D7] hover:bg-[#FFF5F5] px-3.5 py-2 rounded-md transition-colors shadow-sm ml-auto shrink-0 block sm:inline-block text-center mt-3 sm:mt-0">
                Update Stock
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Products"
          value={products.length}
          color="green"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
        />
        <StatCard
          label="Total Revenue"
          value={`₦${revenue.toLocaleString()}`}
          color="gold"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="Total Orders"
          value={orders.length}
          color="blue"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          }
        />
        <StatCard
          label="Pending Payout"
          value={`₦${pendingPayout.toLocaleString()}`}
          color="red"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Recent products */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">My Products</h2>
        <Link
          href="/dashboard/seller/products"
          className="text-sm text-green-600 hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p>No products yet.</p>
            <Link
              href="/dashboard/seller/products/new"
              className="mt-3 inline-block px-5 py-2 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-sm"
            >
              List your first product
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Product", "Price", "Stock", "Sold", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.slice(0, 5).map((p) => (
                <tr
                  key={p._id.toString()}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">
                    {p.title}
                  </td>
                  <td className="px-4 py-3 text-green-700 font-semibold">
                    ₦{p.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                  <td className="px-4 py-3 text-gray-600">{p.sold}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
