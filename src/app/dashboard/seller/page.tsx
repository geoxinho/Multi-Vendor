import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
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

  const [products, orders, sellerUser] = await Promise.all([
    Product.find({ seller: session!.user.id }).lean(),
    Order.find({
      "items.seller": session!.user.id,
      paymentStatus: "paid",
    }).lean(),
    User.findById(session!.user.id).select("name storeName").lean(),
  ]);

  const brandName = sellerUser?.storeName || session.user.storeName || sellerUser?.name || session.user.name || "Seller";

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

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <span>{greeting}, {session.user.name || sellerUser?.name || "Seller"}!</span> <i className="fa-solid fa-hand-wave text-yellow-400 text-xl" />
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Seller Dashboard &bull; Manage your store and track performance.
          </p>
        </div>
        <Link
          href="/dashboard/seller/products/new"
          className="px-5 py-2.5 bg-[#A4860E] text-white font-bold rounded-md hover:bg-[#8a6f0b] transition-colors text-sm shadow-sm"
        >
          + New Product
        </Link>
      </div>

      {/* Seller Notifications */}
      {(newOrdersCount > 0 || undeliveredCount > 0 || lowStockAlerts.length > 0) && (
        <div className="mb-8 space-y-3">
          {newOrdersCount > 0 && (
            <div className="bg-[#fdf8e8] border border-[#BFDBFE]/60 rounded-xl p-4 flex items-center justify-between shadow-[0_2px_8px_rgba(37,99,235,0.03)] animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#DBEAFE] flex items-center justify-center text-[#A4860E] border border-[#BFDBFE]/40">
                  <i className="fa-solid fa-bell text-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1E40AF]">New Orders Received</h4>
                  <p className="text-xs text-[#A4860E] mt-0.5">You have {newOrdersCount} new order{newOrdersCount > 1 ? "s" : ""} awaiting processing.</p>
                </div>
              </div>
              <Link href="/dashboard/seller/orders" className="text-xs font-bold text-[#A4860E] bg-white border border-[#BFDBFE] hover:bg-[#fdf8e8] px-3.5 py-2 rounded-md transition-colors shadow-sm">
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
          icon={<i className="fa-solid fa-box text-lg" />}
        />
        <StatCard
          label="Total Revenue"
          value={`₦${revenue.toLocaleString()}`}
          color="gold"
          icon={<i className="fa-solid fa-money-bill-wave text-lg" />}
        />
        <StatCard
          label="Total Orders"
          value={orders.length}
          color="blue"
          icon={<i className="fa-solid fa-cart-shopping text-lg" />}
        />
        <StatCard
          label="Pending Payout"
          value={`₦${pendingPayout.toLocaleString()}`}
          color="red"
          icon={<i className="fa-solid fa-wallet text-lg" />}
        />
      </div>

      {/* Recent products */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">My Products</h2>
        <Link
          href="/dashboard/seller/products"
          className="text-sm text-[#A4860E] hover:underline"
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
              className="mt-3 inline-block px-5 py-2 bg-[#A4860E] text-white font-semibold rounded-xl hover:bg-[#8a7009] transition-colors text-sm"
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
                  <td className="px-4 py-3 text-[#A4860E] font-semibold">
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
