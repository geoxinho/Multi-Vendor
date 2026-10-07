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
        {/* Main inline thank-you card removed — using pop-up modal only */}

        {/* Re-open modal button if closed */}
        {!showModal && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-[#A4860E] font-bold hover:underline inline-flex items-center gap-1"
            >
              <i className="fa-solid fa-window-restore" />
              Re-open Order Confirmation Pop-Up
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
              Thank you for purchasing on CampusGo. Your payment was successful!
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
                  Give this 6-digit PIN to the seller{" "}
                  <strong>only after</strong> receiving your item.
                </p>
              </div>
            )}

            {order && order.items && order.items.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-left mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Order Items
                </p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs"
                    >
                      <span className="font-medium text-gray-800 truncate max-w-[200px]">
                        {item.quantity}× {item.title}
                      </span>
                      <span className="font-bold text-[#A4860E]">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-600">Total</span>
                  <span className="text-[#A4860E] text-sm">
                    ₦{order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/dashboard/buyer/orders"
                className="w-full py-3 bg-[#A4860E] hover:bg-[#8a7009] text-white font-bold rounded-xl transition-all text-sm shadow-md shadow-[#A4860E]/20 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-box-archive" />
                <span>Go to Order Page</span>
              </Link>
              <Link
                href="/products"
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-bag-shopping" />
                <span>Continue Shopping</span>
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Close popup
              </button>
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
