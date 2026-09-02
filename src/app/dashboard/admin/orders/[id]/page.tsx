"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface OrderDetail {
  _id: string;
  buyer?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    school?: string;
  };
  items: {
    _id: string;
    product?: { _id: string; title: string; images: string[]; price: number };
    title: string;
    image: string;
    price: number;
    quantity: number;
    platformFee: number;
    netPayout: number;
    selectedSize?: string;
    selectedColor?: string;
    seller?: {
      _id: string;
      name: string;
      storeName?: string;
      email: string;
      phone?: string;
      bankDetails?: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
      };
    };
  }[];
  totalAmount: number;
  platformFee: number;
  netPayout: number;
  paymentRef: string;
  paymentStatus: "pending" | "paid" | "failed";
  deliveryStatus: "processing" | "shipped" | "delivered" | "cancelled";
  deliveredAt?: string;
  sellerPayoutReleaseAt?: string;
  sellerPaid: boolean;
  payoutHeld: boolean;
  payoutHoldReason?: string;
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
  updatedAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/orders/${id}`).then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      }),
      fetch(`/api/reports?orderId=${id}`).then((res) => res.json()).catch(() => ({ reports: [] })),
    ])
      .then(([orderData, reportsData]) => {
        setOrder(orderData);
        setReports(reportsData.reports ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (field: "deliveryStatus" | "paymentStatus", value: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        fetchOrder();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update order status");
      }
    } catch {
      alert("Error updating order");
    } finally {
      setUpdating(false);
    }
  };

  const handleTogglePayoutHold = async () => {
    if (!order) return;
    const shouldHold = !order.payoutHeld;
    let reason = "";
    if (shouldHold) {
      const input = prompt("Enter a reason for holding seller payout:");
      if (input === null) return;
      reason = input.trim();
    } else {
      if (!confirm("Release the payout hold on this order?")) return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          action: shouldHold ? "hold" : "release",
          reason,
        }),
      });
      if (res.ok) {
        fetchOrder();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update payout hold");
      }
    } catch {
      alert("Error updating payout status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  if (!order) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">Could not retrieve order details.</p>
        <Link
          href="/dashboard/admin/orders"
          className="px-5 py-2.5 bg-[#A4860E] text-white font-semibold rounded-xl text-sm hover:bg-[#8a7009]"
        >
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/orders"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold border capitalize ${STATUS_COLOR[order.deliveryStatus] || "bg-gray-100 text-gray-600"}`}>
                {order.deliveryStatus}
              </span>
              <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold border capitalize ${STATUS_COLOR[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })} &bull; ID: <span className="font-mono">{order._id}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTogglePayoutHold}
            disabled={updating || order.sellerPaid}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              order.payoutHeld
                ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
            } ${order.sellerPaid ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <i className={`fa-solid ${order.payoutHeld ? "fa-lock-open" : "fa-hand"}`} />
            {order.payoutHeld ? "Release Payout Hold" : "Hold Seller Payout"}
          </button>
        </div>
      </div>

      {/* Payout Hold Alert */}
      {order.payoutHeld && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <i className="fa-solid fa-triangle-exclamation text-amber-600 text-lg mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Seller Payout is on Hold</p>
            <p className="text-xs text-amber-800 mt-0.5">
              <strong>Reason:</strong> {order.payoutHoldReason || "Placed on administrative hold."}
            </p>
          </div>
          <button
            onClick={handleTogglePayoutHold}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Release Hold
          </button>
        </div>
      )}

      {/* Complaints / Disputes on this Order */}
      {reports.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <i className="fa-solid fa-triangle-exclamation text-red-600" />
              <span>{reports.length} Customer Dispute / Abnormality Report{reports.length > 1 ? "s" : ""} on this Order</span>
            </div>
            <Link
              href="/dashboard/admin/reports"
              className="text-xs font-bold text-red-700 hover:underline"
            >
              Open Complaints Hub &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r._id} className="bg-white p-3.5 rounded-xl border border-red-100 text-xs text-gray-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{r.subject}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-gray-600">
                  <strong>Reported by {r.reporterRole}:</strong> {r.reportedBy?.name || "User"} ({r.reportedBy?.email}) &bull; Reason: <strong>{r.reason}</strong>
                </p>
                <p className="text-gray-700 bg-gray-50 p-2 rounded-lg mt-1 italic">
                  "{r.description}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Customer Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Order Items ({order.items.length})
              </h2>
              <span className="text-xs text-gray-500 font-semibold">Total: ₦{order.totalAmount.toLocaleString()}</span>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items.map((item, idx) => {
                const img = item.image || item.product?.images?.[0] || "";
                const itemTotal = item.price * item.quantity;
                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      {img ? (
                        <Image src={img} alt={item.title} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <i className="fa-solid fa-box text-xl" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          {item.product?._id ? (
                            <Link
                              href={`/dashboard/admin/products/${item.product._id}`}
                              className="text-sm font-bold text-gray-900 hover:text-[#A4860E] transition-colors line-clamp-1"
                            >
                              {item.title}
                            </Link>
                          ) : (
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            ₦{item.price.toLocaleString()} &times; {item.quantity} unit{item.quantity > 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-sm font-black text-gray-900 shrink-0">
                          ₦{itemTotal.toLocaleString()}
                        </p>
                      </div>

                      {/* Variants */}
                      {(item.selectedSize || item.selectedColor) && (
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.selectedSize && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-[#A4860E] border border-amber-200 text-[10px] font-bold">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-semibold">
                              Colour: {item.selectedColor}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Seller Tag */}
                      {item.seller && (
                        <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                          <i className="fa-solid fa-store text-gray-400" />
                          <span>Seller: <strong className="text-gray-800">{item.seller.storeName || item.seller.name}</strong></span>
                          <span>&bull;</span>
                          <a href={`mailto:${item.seller.email}`} className="text-[#A4860E] hover:underline">
                            {item.seller.email}
                          </a>
                          {item.seller.phone && <span>({item.seller.phone})</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buyer Information & Shipping Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Buyer Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buyer Information</h2>
              {order.buyer ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                      {order.buyer.name?.[0]?.toUpperCase() || "B"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{order.buyer.name}</p>
                      <p className="text-gray-400 text-[11px]">Campus Buyer</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Email:</span>
                    <a href={`mailto:${order.buyer.email}`} className="text-[#A4860E] hover:underline font-medium">
                      {order.buyer.email}
                    </a>
                  </div>
                  {order.buyer.phone && (
                    <div>
                      <span className="text-gray-400 block">Phone:</span>
                      <span className="text-gray-800 font-medium">{order.buyer.phone}</span>
                    </div>
                  )}
                  {order.buyer.school && (
                    <div>
                      <span className="text-gray-400 block">School / Campus:</span>
                      <span className="text-gray-800 font-medium">{order.buyer.school}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Buyer details unavailable.</p>
              )}
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Address</h2>
              {order.shippingAddress ? (
                <div className="space-y-1.5 text-xs text-gray-700">
                  <p className="font-bold text-gray-900 text-sm">{order.shippingAddress.fullName}</p>
                  <p className="leading-relaxed">{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                  <p className="text-gray-500 font-medium pt-1">Contact: {order.shippingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No address recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Status & Financial Summary (1 col) */}
        <div className="space-y-6">
          {/* Order Status & Delivery Control */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Management &amp; Controls</h2>

            {/* Delivery Status update */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delivery Status</label>
              <select
                value={order.deliveryStatus}
                disabled={updating}
                onChange={(e) => handleUpdateStatus("deliveryStatus", e.target.value)}
                className="w-full text-xs font-semibold border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A4860E]/20 focus:border-[#A4860E]"
              >
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status update */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Status</label>
              <select
                value={order.paymentStatus}
                disabled={updating}
                onChange={(e) => handleUpdateStatus("paymentStatus", e.target.value)}
                className="w-full text-xs font-semibold border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A4860E]/20 focus:border-[#A4860E]"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Delivery PIN */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-semibold block mb-1">Delivery Verification PIN:</span>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="font-mono text-base font-black text-amber-900 tracking-widest">{order.deliveryPin}</span>
                <span className="text-[10px] font-bold text-amber-700 uppercase">Buyer PIN</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financial Overview</h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold">₦{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#A4860E]">
                <span>Platform Commission (5%):</span>
                <span className="font-bold">+₦{(order.platformFee ?? order.totalAmount * 0.05).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Net Seller Payout (95%):</span>
                <span className="font-bold">₦{(order.netPayout ?? order.totalAmount * 0.95).toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center text-sm">
                <span className="font-bold text-gray-900">Total Charged:</span>
                <span className="font-black text-gray-900 text-lg">₦{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payout status card */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Seller Payout Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  order.sellerPaid ? "bg-green-100 text-green-700" : order.payoutHeld ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-700"
                }`}>
                  {order.sellerPaid ? "Disbursed" : order.payoutHeld ? "On Hold" : "Pending Release"}
                </span>
              </div>
              {order.sellerPayoutReleaseAt && !order.sellerPaid && (
                <p className="text-[11px] text-gray-500">
                  Release eligible after: {new Date(order.sellerPayoutReleaseAt).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}
                </p>
              )}
            </div>
          </div>

          {/* Payment Reference */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-2.5 shadow-xs text-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h2>
            <div className="flex justify-between text-gray-500">
              <span>Provider:</span>
              <span className="font-semibold text-gray-800">Paystack</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Reference:</span>
              <span className="font-mono text-gray-800 bg-gray-50 p-1.5 rounded border border-gray-100 block break-all">
                {order.paymentRef || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}