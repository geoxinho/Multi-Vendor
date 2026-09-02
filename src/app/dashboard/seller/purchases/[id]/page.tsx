import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import Image from "next/image";
import Link from "next/link";
import OrderReportButton from "@/components/orders/OrderReportButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Purchase Details" };

type Props = { params: Promise<{ id: string }> };

async function getOrder(id: string, userId: string) {
  await connectDB();
  try {
    const order = await Order.findById(id)
      .populate("buyer", "name email")
      .populate("items.product", "title images _id")
      .lean();
    if (!order) return null;
    // Only the buyer (in this case, our seller user acting as a buyer) can view this
    if ((order.buyer as { _id: { toString(): string } })._id.toString() !== userId) return null;
    return JSON.parse(JSON.stringify(order));
  } catch {
    return null;
  }
}

const STATUS_COLOR: Record<string, string> = {
  paid:       "bg-green-100 text-green-700",
  pending:    "bg-yellow-100 text-yellow-700",
  failed:     "bg-red-100 text-red-700",
  delivered:  "bg-[#fdf8e8] text-[#A4860E] border-[#e8d48a]",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-purple-100 text-purple-700",
};

export default async function SellerPurchaseDetailsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const order = await getOrder(id, session.user.id);
  if (!order) notFound();

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/seller/purchases" className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors">
          <i className="fa-solid fa-arrow-left text-sm" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Purchase Details</h1>
          <p className="text-sm text-gray-500">#{order._id.toString().slice(-8).toUpperCase()}</p>
        </div>
      </div>

      {/* Message Seller & Report */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Link 
          href={`/dashboard/seller/messages?orderId=${order._id}`}
          className="flex items-center gap-2 justify-center w-full bg-[#fdf8e8] border border-[#e8d48a] text-[#A4860E] py-3 rounded-2xl font-bold hover:bg-[#fdf8e8]/50 transition-colors text-sm"
        >
          <i className="fa-solid fa-comment-dots text-sm" />
          Message Seller
        </Link>
        <OrderReportButton
          orderId={order._id}
          role="buyer"
          className="flex items-center gap-2 justify-center w-full bg-red-50 border border-red-200 text-red-700 py-3 rounded-2xl font-bold hover:bg-red-100 transition-colors text-sm"
        />
      </div>

      {/* Delivery PIN Code Alert for the buyer (the seller who purchased) */}
      {order.paymentStatus === "paid" && order.deliveryStatus !== "delivered" && (
        <div className="mb-4 p-4 rounded-xl border border-[#e8d48a] bg-[#fdf8e8]/50 text-gray-900 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-[#A4860E]">
              <i className="fa-solid fa-key" />
              <span>Delivery Verification PIN:</span>
            </div>
            <span className="font-mono text-sm font-black px-2.5 py-0.5 bg-[#fdf8e8] text-[#A4860E] rounded-lg tracking-wider select-all border border-[#e8d48a] self-start sm:self-auto">
              {order.deliveryPin}
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            <i className="fa-solid fa-triangle-exclamation text-[#A4860E]" /> <strong>IMPORTANT:</strong> You must <strong>NOT</strong> disclose this 6-digit PIN to the selling merchant until you have physically received and verified the items.
          </p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
          Items ({order.items.length})
        </h2>
        <div className="space-y-4">
          {order.items.map((item: {
            _id: string;
            title: string;
            image: string;
            price: number;
            quantity: number;
            product?: { _id: string; images: string[] };
          }) => {
            const img = item.image || item.product?.images?.[0] || "";
            const productId = item.product?._id;
            return (
              <div key={item._id} className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                  {img ? (
                    <Image src={img} alt={item.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <i className="fa-solid fa-image text-xl" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {productId ? (
                    <Link href={`/products/${productId}`} className="text-sm font-semibold text-gray-900 hover:text-[#A4860E] transition-colors line-clamp-2">
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ₦{item.price.toLocaleString()}</p>
                </div>
                <p className="text-sm font-bold text-[#A4860E] shrink-0">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Total Price</span>
          <span className="text-xl font-extrabold text-[#A4860E]">₦{order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Delivery Address</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p className="text-gray-500">{order.shippingAddress.phone}</p>
          </div>
        </div>
      )}

      {/* Payment info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Payment Info</h2>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Reference</span>
          <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{order.paymentRef || "—"}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Status</span>
          <span className={`badge ${STATUS_COLOR[order.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>{order.paymentStatus}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Placed on</span>
          <span>{new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" })}</span>
        </div>
      </div>
    </div>
  );
}
