"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

/* Tell TypeScript about the Paystack global injected by the script tag */
declare global {
  interface Window {
    PaystackPop: {
      setup: (opts: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        currency?: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

const CAMPUS_SCHOOLS = [
  "Adeleke University",
];

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    school: "Adeleke University",
    hostel: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [serverError, setServerError] = useState("");
  const callbackFired = useRef(false);

  /* Redirect if not logged in, cart is empty, or trying to buy own product */
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/auth/login?callbackUrl=/checkout");
      return;
    }
    if (items.length === 0) {
      router.replace("/products");
      return;
    }

    const isOwnProduct = items.some((item) => item.sellerId === session.user.id);
    if (isOwnProduct) {
      const target = session.user.role === "admin" ? "/dashboard/admin" : "/dashboard/seller";
      router.replace(target);
      return;
    }
  }, [session, status, items, router]);

  /* Pre-fill name & school from session */
  useEffect(() => {
    if (session?.user) {
      setAddress((a) => ({
        ...a,
        fullName: a.fullName || session.user.name || "",
        school: (session.user as any).school || a.school || "Adeleke University",
      }));
    }
  }, [session]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!address.fullName.trim() || address.fullName.length < 2) e.fullName = "Enter your full name";
    if (!address.phone.trim() || address.phone.length < 10) e.phone = "Enter a valid 10-digit phone number";
    if (!address.school) e.school = "Select your campus/school";
    if (!address.hostel.trim() || address.hostel.length < 2) e.hostel = "Enter your hostel/hall or campus location";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createOrder = async (paymentRef: string) => {
    setServerError("");
    setPaying(true);
    try {
      const shippingData = {
        fullName: address.fullName,
        phone: address.phone,
        address: `${address.hostel.trim()}, ${address.school}`,
        city: "Ede",
        state: "Osun",
        postalCode: "232101",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: shippingData,
          paymentRef,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            selectedSize: i.selectedSize ?? "",
            selectedColor: i.selectedColor ?? "",
          })),
        }),
      });
      const data = await res.json();
      setPaying(false);
      if (!res.ok) {
        setServerError(data.error ?? "Order creation failed. Please contact support.");
        return;
      }
      clearCart();
      try {
        if (data && data._id) {
          sessionStorage.setItem("last_order", JSON.stringify(data));
        }
      } catch {
        // ignore storage error
      }
      window.location.href = `/checkout/success?orderId=${data._id}`;
    } catch (err) {
      console.error(err);
      setPaying(false);
      setServerError("Network error. Could not complete order.");
    }
  };

  const handlePay = () => {
    if (!validate()) return;
    if (!scriptLoaded || !window.PaystackPop) {
      setServerError("Paystack payment gateway is loading. Please wait a moment and try again.");
      return;
    }

    setPaying(true);
    setServerError("");

    const ref = `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    callbackFired.current = false;
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: session!.user.email!,
      amount: Math.round(totalPrice() * 100),
      ref,
      currency: "NGN",
      onClose: () => {
        if (!callbackFired.current) {
          setPaying(false);
          setServerError("Payment window closed. Your order was not completed.");
        }
      },
      callback: (response) => {
        callbackFired.current = true;
        createOrder(response.reference);
      },
    });

    handler.openIframe();
  };

  const total = totalPrice();

  if (status === "loading" || items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#A4860E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onReady={() => setScriptLoaded(true)}
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/products" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <i className="fa-solid fa-chevron-left text-sm" />
              <span className="text-sm font-medium">Back to shopping</span>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
            <div className="w-24" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Left: Campus Delivery Form ── */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-[#fdf8e8] border border-[#e8d48a] flex items-center justify-center text-[#A4860E]">
                    <i className="fa-solid fa-[#A4860E]" />
                    <i className="fa-solid fa-graduation-cap text-base" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">Campus Delivery Details</h2>
                    <p className="text-xs text-gray-500">Order pickup & campus hall delivery details</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] transition-colors ${
                        errors.fullName ? "border-red-500 bg-red-50" : "border-[#E5E5E5] bg-white"
                      }`}
                    />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                      placeholder="e.g. 08012345678"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] transition-colors ${
                        errors.phone ? "border-red-500 bg-red-50" : "border-[#E5E5E5] bg-white"
                      }`}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    <p className="text-xs text-gray-400 mt-1">For delivery updates & seller calls</p>
                  </div>

                  {/* University Campus */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      University Campus <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={address.school}
                        onChange={(e) => setAddress((a) => ({ ...a, school: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] transition-colors bg-white appearance-none pr-10"
                      >
                        <option value="Adeleke University">Adeleke University (Ede, Osun State)</option>
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <i className="fa-solid fa-chevron-down text-xs" />
                      </span>
                    </div>
                  </div>

                  {/* Hostel / Hall of Residence / Pickup Point */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Hostel / Hall of Residence / Pickup Point <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address.hostel}
                      onChange={(e) => setAddress((a) => ({ ...a, hostel: e.target.value }))}
                      placeholder="e.g. Hall A, Room 204 or Main Gate Pickup"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] transition-colors ${
                        errors.hostel ? "border-red-500 bg-red-50" : "border-[#E5E5E5] bg-white"
                      }`}
                    />
                    {errors.hostel && <p className="text-xs text-red-500 mt-1">{errors.hostel}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 sticky top-6 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>

                {/* Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-50 border border-gray-200">
                        {item.image ? (
                          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <i className="fa-solid fa-image text-lg" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#111111] shrink-0">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Campus Delivery</span>
                    <span className="text-[#A4860E] font-medium">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-[#111111] font-bold">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                {serverError && (
                  <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    <i className="fa-solid fa-triangle-exclamation shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Pay button */}
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full py-3.5 bg-[#A4860E] text-white font-bold rounded-xl hover:bg-[#8a6f0b] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-md shadow-[#A4860E]/20"
                >
                  {paying ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin text-sm" />
                      Processing Order…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-lock text-sm" />
                      Pay ₦{total.toLocaleString()} with Paystack
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                  <i className="fa-solid fa-shield-halved text-[#A4860E] text-xs" />
                  Secured & Escrow Protected by CampusGo
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
