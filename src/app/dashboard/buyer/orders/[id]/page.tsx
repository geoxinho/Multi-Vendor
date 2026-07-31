import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Details" };

type Props = { params: Promise<{ id: string }> };

async function getOrder(id: string, userId: string) {
  await connectDB();
  try {
    const order = await Order.findById(id)
      .populate("buyer", "name email")
      .populate("items.product", "title images _id")
      .lean();
    if (!order) return null;
    // Only the buyer (or admin) can view this page
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
  delivered:  "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-purple-100 text-purple-700",
};

const DELIVERY_STEPS = ["processing", "shipped", "delivered"];

export default async function BuyerOrderDetailsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const order = await getOrder(id, session.user.id);
  if (!order) notFound();

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/buyer/orders" className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Order Details</h1>
          <p className="text-sm text-gray-500">#{order._id.toString().slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="mb-4">
        <Link 
          href={`/dashboard/buyer/messages?orderId=${order._id}`}
          className="flex items-center gap-2 justify-center w-full bg-teal-50 border border-teal-200 text-teal-700 py-3 rounded-2xl font-bold hover:bg-teal-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message Seller
        </Link>
      </div>

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
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {productId ? (
                    <Link href={`/products/${productId}`} className="text-sm font-semibold text-gray-900 hover:text-green-700 transition-colors line-clamp-2">
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ₦{item.price.toLocaleString()}</p>
                </div>
                <p className="text-sm font-bold text-green-700 shrink-0">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Order Total</span>
          <span className="text-xl font-extrabold text-green-700">₦{order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {order.paymentStatus === "paid" && order.deliveryStatus !== "delivered" && (
        <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-900 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 font-bold">
              <i className="fa-solid fa-key text-amber-600" />
              <span>Delivery Verification PIN:</span>
            </div>
            <span className="font-mono text-sm font-black px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-lg tracking-wider select-all border border-amber-200 self-start sm:self-auto">
              {order.deliveryPin}
            </span>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            <i className="fa-solid fa-triangle-exclamation" /> <strong>IMPORTANT:</strong> You must <strong>NOT</strong> disclose this 6-digit PIN to the seller until the package has been physically delivered to you.
          </p>
        </div>
      )}

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
          <span className={`badge ${STATUS_COLOR[order.paymentStatus]}`}>{order.paymentStatus}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Placed on</span>
          <span>{new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" })}</span>
        </div>
      </div>

      {/* Review prompt for delivered orders */}
      {order.deliveryStatus === "delivered" && order.paymentStatus === "paid" && (
        <div className="mt-4 bg-green-50 rounded-2xl border border-green-100 p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800 text-sm">Order delivered! <i className="fa-solid fa-party-horn text-green-600" /></p>
            <p className="text-xs text-green-600 mt-0.5">Please leave a review for the items you received.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {order.items.map((item: { _id: string; title: string; product?: { _id: string } }) =>
              item.product?._id ? (
                <Link
                  key={item._id}
                  href={`/products/${item.product._id}#reviews`}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
                >
                  Review
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}
