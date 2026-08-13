"use client";

import { useState, useEffect } from "react";
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

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();

  const [address, setAddress] = useState({
    fullName: "", address: "", city: "", state: "", postalCode: "", phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [serverError, setServerError] = useState("");

  /* Redirect if not a buyer or cart is empty */
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "buyer") {
      router.replace("/auth/login?callbackUrl=/checkout");
      return;
    }
    if (items.length === 0) router.replace("/products");
  }, [session, status, items, router]);

  /* Pre-fill name from session */
  useEffect(() => {
    if (session?.user?.name && !address.fullName) {
      setAddress((a) => ({ ...a, fullName: session.user.name ?? "" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!address.fullName.trim() || address.fullName.length < 2) e.fullName = "Enter your full name";
    if (!address.address.trim() || address.address.length < 5) e.address = "Enter a valid address";
    if (!address.city.trim()) e.city = "Enter your city";
    if (!address.state) e.state = "Select your state";
    if (!address.postalCode.trim() || address.postalCode.length < 4) e.postalCode = "Enter a valid postal code";
    if (!address.phone.trim() || address.phone.length < 10) e.phone = "Enter a valid 10-digit phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createOrder = async (paymentRef: string) => {
    setServerError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddress: address,
        paymentRef,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    });
    const data = await res.json();
    setPaying(false);
    if (!res.ok) {
      setServerError(data.error ?? "Order creation failed. Please contact support.");
      return;
    }
    clearCart();
    router.push(`/checkout/success?orderId=${data._id}`);
  };

  const handlePay = () => {
    if (!validate()) return;
    if (!scriptLoaded || !window.PaystackPop) {
      setServerError("Paystack is not loaded yet. Please wait and try again.");
      return;
    }

    setPaying(true);
    setServerError("");

    const ref = `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: session!.user.email!,
      amount: Math.round(totalPrice() * 100), // kobo
      ref,
      currency: "NGN",
      onClose: () => {
        setPaying(false);
        setServerError("Payment was cancelled. Your order has not been placed.");
      },
      callback: (response) => {
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

            {/* ── Left: Shipping Form ── */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-5">Delivery Information</h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                      placeholder="John Doe"
                      className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none focus:border-[#A4860E] transition-colors ${errors.fullName ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E5E5E5]"}`}
                    />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                      placeholder="08012345678"
                      className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none focus:border-[#A4860E] transition-colors ${errors.phone ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E5E5E5]"}`}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={address.address}
                      onChange={(e) => setAddress((a) => ({ ...a, address: e.target.value }))}
                      placeholder="12 Broad Street, Victoria Island"
                      className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none focus:border-[#A4860E] transition-colors ${errors.address ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E5E5E5]"}`}
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                        placeholder="Lagos"
                        className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none focus:border-[#A4860E] transition-colors ${errors.city ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E5E5E5]"}`}
                      />
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                      <select
                        value={address.state}
                        onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none focus:border-[#A4860E] transition-colors bg-white ${errors.state ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E5E5E5]"}`}
                      >
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
                      placeholder="100001"
                      className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none focus:border-[#A4860E] transition-colors ${errors.postalCode ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E5E5E5]"}`}
                    />
                    {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
                  </div>
                </div>
              </div>

              {/* Test mode notice */}
              <div className="bg-[#fdf8e8] rounded-md border border-[#BFDBFE] p-4">
                <p className="text-sm font-semibold text-[#1E40AF] mb-1"><i className="fa-solid fa-flask text-[#A4860E]" /> Paystack Test Mode</p>
                <p className="text-xs text-[#A4860E]">Test card: <span className="font-mono font-semibold">4084 0840 8408 4081</span></p>
                <p className="text-xs text-[#A4860E]">CVV: <span className="font-mono font-semibold">408</span> &nbsp;|&nbsp; Expiry: <span className="font-mono font-semibold">12/25</span> &nbsp;|&nbsp; PIN: <span className="font-mono font-semibold">0000</span> &nbsp;|&nbsp; OTP: <span className="font-mono font-semibold">123456</span></p>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="lg:col-span-2">
              <div className="bg-[#FAFAFA] rounded-md border border-[#E5E5E5] p-6 sticky top-24">
                <h2 className="font-bold text-gray-900 text-lg mb-5">
                  Order Summary <span className="text-gray-400 font-normal text-sm">({items.length} item{items.length !== 1 ? "s" : ""})</span>
                </h2>

                {/* Items list */}
                <div className="space-y-4 mb-5 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <i className="fa-solid fa-image text-lg" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
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
                    <span>Delivery fee</span>
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
                  disabled={paying || !scriptLoaded}
                  className="w-full py-3.5 bg-[#A4860E] text-white font-bold rounded-md hover:bg-[#8a6f0b] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                  {paying ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin text-sm" />
                      Processing…
                    </>
                  ) : !scriptLoaded ? (
                    "Loading payment…"
                  ) : (
                    <>
                      <i className="fa-solid fa-lock text-sm" />
                      Pay ₦{total.toLocaleString()} with Paystack
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                  <i className="fa-solid fa-shield-halved text-[#A4860E] text-xs" />
                  Secured by Paystack
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
