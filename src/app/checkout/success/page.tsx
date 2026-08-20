"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

interface OrderItem {
  _id: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface OrderDetails {
  _id: string;
  deliveryPin: string;
  totalAmount: number;
  items: OrderItem[];
  paymentStatus: string;
  deliveryStatus: string;
  createdAt: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data._id) setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf8e8]/30 via-white to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 text-center max-w-xl w-full shadow-xl shadow-gray-200/50">
        
        {/* Animated Success Badge */}
        <div className="relative w-20 h-20 bg-[#F0FDF4] border-2 border-[#BBF7D0] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#A4860E] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
            ✓
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Thank You for Your Order! 🎉
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Payment confirmed. Your order has been placed and is being prepared for delivery.
        </p>

        {orderId && (
          <div className="mb-6 inline-flex items-center gap-2 bg-gray-50 px-4 py-1.5 border border-gray-200 rounded-full text-xs font-mono text-gray-600">
            <span className="text-gray-400">Order ID:</span>
            <span className="font-bold text-gray-900">#{orderId.slice(-10).toUpperCase()}</span>
          </div>
        )}

        {/* ── DELIVERY PIN HIGHLIGHT BOX ── */}
        {order?.deliveryPin && (
          <div className="mb-6 bg-gradient-to-br from-[#fdf8e8] to-[#fffbeb] border-2 border-[#e8d48a] rounded-2xl p-5 text-left shadow-sm">
            <div className="flex items-center gap-2 text-[#9A3412] font-bold text-xs uppercase tracking-wider mb-2">
              <i className="fa-solid fa-key text-[#A4860E] text-sm" />
              <span>Your Delivery Verification PIN</span>
            </div>
            <div className="flex items-center justify-between gap-4 bg-white px-4 py-3 rounded-xl border border-[#e8d48a] my-2">
              <span className="text-xs text-gray-500 font-medium">Delivery PIN:</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-[#A4860E] tracking-widest select-all">
                {order.deliveryPin}
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed mt-2">
              <strong>Keep this 6-digit PIN secret.</strong> Share it with the seller ONLY after physically receiving and verifying your package.
            </p>
          </div>
        )}

        {/* ── ORDER ITEMS BREAKDOWN ── */}
        {order && order.items && order.items.length > 0 && (
          <div className="mb-6 bg-gray-50/70 border border-gray-100 rounded-2xl p-4 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Order Items ({order.items.length})
            </p>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div key={item._id || idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-200">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <i className="fa-solid fa-bag-shopping" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.title}</p>
                    {(item.selectedSize || item.selectedColor) && (
                      <div className="flex items-center gap-1.5 my-0.5">
                        {item.selectedSize && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-[#A4860E]">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            Colour: {item.selectedColor}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity} × ₦{item.price.toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-900 shrink-0">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
              <span className="font-medium text-gray-500">Total Paid</span>
              <span className="text-base font-extrabold text-[#A4860E]">₦{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* ── AUTOMATED MESSAGE & EMAIL NOTICE ── */}
        <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-left flex items-start gap-2.5">
          <i className="fa-solid fa-comment-dots text-blue-600 text-sm mt-0.5 shrink-0" />
          <p className="text-xs text-blue-900 leading-relaxed">
            An automated thank-you message and order confirmation email have been sent to your account. You can chat with the seller anytime.
          </p>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/buyer/orders"
            className="flex-1 py-3 px-4 bg-[#A4860E] text-white font-bold rounded-xl hover:bg-[#8a7009] transition-colors text-sm shadow-md shadow-[#A4860E]/20 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-box-archive" />
            <span>View My Orders</span>
          </Link>
          <Link
            href="/products"
            className="flex-1 py-3 px-4 bg-gray-100 border border-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-[#A4860E]" />
            <i className="fa-solid fa-bag-shopping" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#A4860E] rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
