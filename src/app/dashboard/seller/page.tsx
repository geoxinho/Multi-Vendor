import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import StatCard from "@/components/dashboard/StatCard";
import PayoutCountdownCard from "@/components/seller/PayoutCountdownCard";
import SellerWalletCard from "@/components/seller/SellerWalletCard";
import { getSellerWalletData } from "@/lib/sellerWallet";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seller Dashboard" };

type OrderItem = {
  seller?: { toString(): string };
  price: number;
  quantity: number;
  netPayout?: number;
};

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user) notFound();
  await connectDB();

  const sellerId = session!.user.id;

  const [products, orders, sellerUser, walletData] = await Promise.all([
    Product.find({ seller: sellerId }).lean(),
    Order.find({
      "items.seller": sellerId,
      paymentStatus: "paid",
    }).lean(),
    User.findById(sellerId).select("name storeName").lean(),
    getSellerWalletData(sellerId),
  ]);

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const totalSales = orders.length;

  // ── Countdown orders ─────────────────────────────────────────────────────────
  const countdownOrders = orders
    .filter(
      (o) =>
        !o.sellerPaid &&
        o.deliveryStatus === "delivered" &&
        o.sellerPayoutReleaseAt,
    )
    .map((o) => ({
      _id: o._id.toString(),
      sellerPayoutReleaseAt: o.sellerPayoutReleaseAt!.toISOString(),
      deliveredAt: (o.deliveredAt ?? o.updatedAt ?? new Date()).toISOString(),
      payoutHeld: o.payoutHeld ?? false,
      payoutHoldReason: o.payoutHoldReason ?? "",
      totalAmount: o.totalAmount,
      items: o.items.map((i: OrderItem & { title?: string; seller?: unknown }) => ({
        title: (i as { title?: string }).title ?? "",
        price: i.price,
        quantity: i.quantity,
        netPayout: i.netPayout ?? i.price * i.quantity * 0.95,
        seller: (i.seller as { toString(): string } | undefined)?.toString() ?? "",
      })),
    }));

  // ── Last 10 Successful Deliveries ─────────────────────────────────────────
  type SuccessfulDeliveryItem = {
    id: string;
    orderId: string;
    productTitle: string;
    price: number;
    quantity: number;
    netPayout: number;
    deliveredAt: Date;
    selectedSize?: string;
    selectedColor?: string;
  };

  const successfulDeliveries: SuccessfulDeliveryItem[] = [];

  const deliveredOrders = orders
    .filter((o) => o.deliveryStatus === "delivered" && (o.deliveredAt || o.updatedAt))
    .sort((a, b) => {
      const dateA = new Date(a.deliveredAt || a.updatedAt).getTime();
      const dateB = new Date(b.deliveredAt || b.updatedAt).getTime();
      return dateB - dateA;
    });

  for (const order of deliveredOrders) {
    const deliveryDate = new Date(order.deliveredAt || order.updatedAt);
    const sellerItems = order.items.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (i: any) => i.seller?.toString() === sellerId
    );

    for (const item of sellerItems) {
      if (successfulDeliveries.length >= 10) break;
      successfulDeliveries.push({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: `${order._id.toString()}-${(item as any).product?.toString() || Math.random()}`,
        orderId: order._id.toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        productTitle: (item as any).title || "Product",
        price: item.price,
        quantity: item.quantity,
        netPayout: item.netPayout ?? item.price * item.quantity * 0.95,
        deliveredAt: deliveryDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectedSize: (item as any).selectedSize,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectedColor: (item as any).selectedColor,
      });
    }

    if (successfulDeliveries.length >= 10) break;
  }

  // ── Notification counts ──────────────────────────────────────────────────────
  const newOrdersCount = orders.filter((o) => o.deliveryStatus === "processing").length;
  const undeliveredCount = orders.filter((o) => o.deliveryStatus !== "delivered").length;
  const lowStockAlerts = products.filter((p) => p.status === "active" && p.stock <= 3);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
        ? "Good Afternoon"
        : "Good Evening";

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <span>
              {greeting}, {session.user.name || sellerUser?.name || "Seller"}!
            </span>{" "}
            <i className="fa-solid fa-hand-wave text-yellow-400 text-xl" />
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

      {/* ── Seller Notifications ── */}
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
                  <p className="text-xs text-[#A4860E] mt-0.5">
                    You have {newOrdersCount} new order{newOrdersCount > 1 ? "s" : ""} awaiting processing.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/seller/orders"
                className="text-xs font-bold text-[#A4860E] bg-white border border-[#BFDBFE] hover:bg-[#fdf8e8] px-3.5 py-2 rounded-md transition-colors shadow-sm"
              >
                Process Orders
              </Link>
            </div>
          )}

          {undeliveredCount > 0 && (
            <div className="bg-[#FFF7ED] border border-[#FFEDD5]/60 rounded-xl p-4 flex items-center justify-between shadow-[0_2px_8px_rgba(217,119,6,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FFEDD5] flex items-center justify-center text-[#D97706] border border-[#FEF3C7]/40">
                  <i className="fa-solid fa-truck-fast text-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#9A3412]">Undelivered Orders</h4>
                  <p className="text-xs text-[#9A3412] mt-0.5">
                    You have {undeliveredCount} order{undeliveredCount > 1 ? "s" : ""} that{" "}
                    {undeliveredCount === 1 ? "has" : "have"} not been delivered to buyers yet.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/seller/orders"
                className="text-xs font-bold text-[#D97706] bg-white border border-[#FFEDD5] hover:bg-[#FFFBEB] px-3.5 py-2 rounded-md transition-colors shadow-sm"
              >
                View Deliveries
              </Link>
            </div>
          )}

          {lowStockAlerts.length > 0 && (
            <div className="bg-[#FFF5F5] border border-[#FED7D7]/60 rounded-xl p-4 shadow-[0_2px_8px_rgba(220,38,38,0.03)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] border border-[#FCA5A5]/40">
                    <i className="fa-solid fa-triangle-exclamation text-sm" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#9B2C2C]">Inventory Alert</h4>
                    <p className="text-xs text-[#9B2C2C] mt-0.5">
                      {lowStockAlerts.length} of your active product
                      {lowStockAlerts.length > 1 ? "s are" : " is"} out of stock or running low.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/seller/products"
                  className="text-xs font-bold text-[#DC2626] bg-white border border-[#FED7D7] hover:bg-[#FFF5F5] px-3.5 py-2 rounded-md transition-colors shadow-sm shrink-0"
                >
                  Update Stock
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 💳 SELLER WALLET CARD ── */}
      <SellerWalletCard
        availableBalance={walletData.availableBalance}
        pendingBalance={walletData.pendingBalance}
        heldBalance={walletData.heldBalance ?? 0}
        totalEarned={walletData.totalEarned}
        hasBankDetails={walletData.hasBankDetails}
        bankDetails={walletData.bankDetails}
        hasHeldOrders={walletData.hasHeldOrders ?? false}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Products"
          value={products.length}
          color="green"
          icon={<i className="fa-solid fa-box text-lg" />}
        />
        <StatCard
          label="Total Sales"
          value={totalSales}
          color="blue"
          icon={<i className="fa-solid fa-cart-shopping text-lg" />}
        />
        <StatCard
          label="Available Balance"
          value={`₦${walletData.availableBalance.toLocaleString()}`}
          color="gold"
          icon={<i className="fa-solid fa-wallet text-lg" />}
          subtitle="Ready to withdraw"
        />
        <StatCard
          label={walletData.hasHeldOrders ? "Held by Admin" : "Pending (24h Lock)"}
          value={`₦${((walletData.heldBalance || 0) + (walletData.pendingBalance || 0)).toLocaleString()}`}
          color={walletData.hasHeldOrders ? "gold" : "red"}
          icon={
            walletData.hasHeldOrders ? (
              <i className="fa-solid fa-lock text-lg" />
            ) : (
              <i className="fa-solid fa-hourglass-half text-lg" />
            )
          }
          subtitle={
            walletData.hasHeldOrders
              ? "Funds under admin review"
              : "Unlocks 24h post-delivery"
          }
        />
      </div>

      {/* ── Payout Countdowns ── */}
      {countdownOrders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i className="fa-solid fa-hourglass-half text-[#A4860E]" />
                Payout Unlock Countdowns
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                95% net payouts unlock to your Available Balance 24 hours after delivery confirmation.
              </p>
            </div>
            <Link
              href="/dashboard/seller/payouts"
              className="text-sm text-[#A4860E] hover:underline font-medium"
            >
              Full schedule &amp; withdrawals →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {countdownOrders.map((order) => (
              <PayoutCountdownCard
                key={order._id}
                order={order}
                sellerId={sellerId}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Successful Deliveries (Max 10) ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-[#A4860E]" />
              Recent Successful Deliveries
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Exact date and time for up to the last 10 completed product deliveries.
            </p>
          </div>
          <Link
            href="/dashboard/seller/orders"
            className="text-sm text-[#A4860E] hover:underline font-medium"
          >
            View all orders →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {successfulDeliveries.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <i className="fa-solid fa-box-open text-2xl mb-2 text-gray-300 block" />
              No successful deliveries completed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Delivery Date &amp; Time
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Net Earned
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {successfulDeliveries.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 truncate max-w-xs">
                          {item.productTitle}
                        </div>
                        {(item.selectedSize || item.selectedColor) && (
                          <div className="text-[11px] text-gray-400">
                            {item.selectedSize && `Size: ${item.selectedSize} `}
                            {item.selectedColor && `Color: ${item.selectedColor}`}
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                          Order #{item.orderId.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-800 font-medium text-xs">
                          <i className="fa-regular fa-calendar-check text-[#A4860E]" />
                          {item.deliveredAt.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <i className="fa-regular fa-clock text-gray-400" />
                          {item.deliveredAt.toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium whitespace-nowrap">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[#A4860E] font-bold">
                          ₦{Math.round(item.netPayout).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block">(95% net)</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="badge bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <i className="fa-solid fa-circle-check text-emerald-600 text-[10px]" />
                          Delivered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent products ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">My Products</h2>
        <Link href="/dashboard/seller/products" className="text-sm text-[#A4860E] hover:underline">
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
                {["Product", "Price", "Net Earn", "Stock", "Status"].map((h) => (
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
                <tr key={p._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">
                    {p.title}
                  </td>
                  <td className="px-4 py-3 text-gray-600">₦{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#A4860E] font-semibold">
                    ₦{Math.round(p.price * 0.95).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.stock}</td>
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
