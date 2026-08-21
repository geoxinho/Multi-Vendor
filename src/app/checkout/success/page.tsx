"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

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
  shippingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  createdAt: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Immediate fallback from sessionStorage if available
    try {
      const stored = sessionStorage.getItem("last_order");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed._id && (!orderId || parsed._id === orderId)) {
          setOrder(parsed);
          setLoading(false);
        }
      }
    } catch {
      // ignore parse errors
    }

    if (!orderId) {
      setLoading(false);
      return;
    }

    // 2. Fetch fresh order from API
    fetch(`/api/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data._id) {
          setOrder(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  const copyPin = () => {
    if (order?.deliveryPin) {
      navigator.clipboard.writeText(order.deliveryPin);
      setCopied(true);
      toast.success("Delivery PIN copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf8e8]/40 via-white to-gray-50 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full px-4 py-10 sm:py-16">
        
        {/* ── MAIN THANK YOU CARD ── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 text-center shadow-xl shadow-amber-900/5 relative overflow-hidden">
          {/* Top Banner Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#A4860E] via-amber-500 to-amber-700" />

          {/* Animated Success Icon */}
          <div className="relative w-20 h-20 bg-[#F0FDF4] border-2 border-[#BBF7D0] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10 text-green-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            Your payment was successful and your order has been placed with the seller.
          </p>

          {(orderId || order?._id) && (
            <div className="mb-6 inline-flex items-center gap-2 bg-gray-50 px-4 py-1.5 border border-gray-200 rounded-full text-xs font-mono text-gray-600">
              <span className="text-gray-400">Order Ref:</span>
              <span className="font-bold text-gray-900">
                #{(orderId || order!._id).slice(-10).toUpperCase()}
              </span>
            </div>
          )}

          {/* ── DELIVERY PIN HIGHLIGHT BOX ── */}
          {order?.deliveryPin && (
            <div className="mb-6 bg-gradient-to-br from-[#fdf8e8] to-[#fffbeb] border-2 border-[#e8d48a] rounded-2xl p-5 text-left shadow-sm">
              <div className="flex items-center justify-between gap-2 text-[#9A3412] font-bold text-xs uppercase tracking-wider mb-2">
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-key text-[#A4860E] text-sm" />
                  <span>Your Delivery Verification PIN</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-[#A4860E] px-2 py-0.5 rounded-full font-bold">Important</span>
              </div>
              <div className="flex items-center justify-between gap-4 bg-white px-4 py-3 rounded-xl border border-[#e8d48a] my-2">
                <span className="text-xs text-gray-500 font-medium">Delivery PIN:</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-[#A4860E] tracking-widest select-all">
                    {order.deliveryPin}
                  </span>
                  <button
                    onClick={copyPin}
                    className="p-2 rounded-lg bg-[#fdf8e8] text-[#A4860E] hover:bg-[#A4860E] hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
                    title="Copy Delivery PIN"
                  >
                    <i className={`fa-solid ${copied ? "fa-check text-green-600" : "fa-copy"}`} />
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
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
                Items Purchased ({order.items.length})
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
                <span className="font-medium text-gray-500">Total Amount Paid</span>
                <span className="text-base font-extrabold text-[#A4860E]">₦{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Loading state indicator */}
          {loading && !order && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#A4860E] rounded-full animate-spin mb-3" />
              <p className="text-xs text-gray-400">Retrieving your order details…</p>
            </div>
          )}

          {/* ── AUTOMATED MESSAGE & EMAIL NOTICE ── */}
          <div className="mb-6 p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-left flex items-start gap-3">
            <i className="fa-solid fa-envelope-circle-check text-blue-600 text-base mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-950">Confirmation Email Sent</p>
              <p className="text-xs text-blue-800 leading-relaxed mt-0.5">
                We sent your order confirmation email and delivery PIN to your registered email address. An automated chat has also been opened with the seller.
              </p>
            </div>
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {(orderId || order?._id) && (
              <Link
                href={`/dashboard/buyer/messages?orderId=${orderId || order!._id}`}
                className="flex-1 py-3 px-4 bg-[#fdf8e8] border border-[#e8d48a] text-[#A4860E] font-bold rounded-xl hover:bg-[#A4860E] hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-comment-dots" />
                <span>Chat with Seller</span>
              </Link>
            )}
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
              <i className="fa-solid fa-bag-shopping" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Re-open modal button if closed */}
        {!showModal && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-[#A4860E] font-bold hover:underline inline-flex items-center gap-1"
            >
              <i className="fa-solid fa-window-restore" />
              Re-open Thank You Pop-Up Modal
            </button>
          </div>
        )}
      </div>

      {/* ── POP-UP THANK YOU MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden p-6 sm:p-8 relative text-center">
            
            {/* Close Modal Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>

            {/* Modal Header Badge */}
            <div className="w-16 h-16 bg-[#F0FDF4] border-2 border-[#BBF7D0] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-circle-check text-green-600 text-2xl" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">
              Order Confirmed! 🎉
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Thank you for purchasing on CampusGo. Your order details are below:
            </p>

            {order?.deliveryPin && (
              <div className="bg-[#fdf8e8] border border-[#e8d48a] rounded-2xl p-4 mb-4 text-left">
                <p className="text-[11px] font-bold text-[#9A3412] uppercase tracking-wider mb-1">
                  🔑 Delivery Verification PIN
                </p>
                <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-[#e8d48a]">
                  <span className="font-mono text-2xl font-black text-[#A4860E] tracking-widest">
                    {order.deliveryPin}
                  </span>
                  <button
                    onClick={copyPin}
                    className="px-2.5 py-1 rounded-lg bg-[#fdf8e8] text-[#A4860E] hover:bg-[#A4860E] hover:text-white transition-colors text-xs font-bold"
                  >
                    {copied ? "Copied!" : "Copy PIN"}
                  </button>
                </div>
                <p className="text-[10px] text-amber-900/80 mt-1.5">
                  Give this 6-digit PIN to the seller <strong>only after</strong> receiving your item.
                </p>
              </div>
            )}

            {order && order.items && order.items.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-left mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Order Items</p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-800 truncate max-w-[200px]">
                        {item.quantity}× {item.title}
                      </span>
                      <span className="font-bold text-[#A4860E]">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-600">Total</span>
                  <span className="text-[#A4860E] text-sm">₦{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 bg-[#A4860E] text-white font-bold rounded-xl hover:bg-[#8a7009] transition-colors text-sm shadow-md"
              >
                Got It, Thank You!
              </button>
              <Link
                href="/dashboard/buyer/orders"
                className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-xs"
              >
                View My Orders Page →
              </Link>
            </div>
          </div>
        </div>
      )}
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
