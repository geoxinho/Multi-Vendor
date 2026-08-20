"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

const FAQ_ITEMS = [
  {
    q: "How does CampusGo payment & payout protection work?",
    a: "Payments are held securely in escrow when an order is placed. Funds are only automatically released to the seller 24 hours AFTER the buyer confirms delivery using their 6-digit Delivery PIN.",
  },
  {
    q: "Where do I find my 6-digit Delivery PIN?",
    a: "Your unique Delivery PIN appears on your Order Details page under 'My Orders' in your buyer dashboard as soon as payment is confirmed. Give this PIN to the seller ONLY after physically receiving and inspecting your item.",
  },
  {
    q: "What should I do if a seller demands payment outside CampusGo?",
    a: "NEVER pay off-platform! Paying outside CampusGo voids buyer protection. Report off-platform payment demands immediately using this Help Desk form.",
  },
  {
    q: "How do I become a verified seller on CampusGo?",
    a: "Sign in to your account, click 'Become a Seller' in the navigation header or dashboard, enter your Store Name, school details, and submit your NIN for instant verification.",
  },
  {
    q: "How long does seller payout transfer take?",
    a: "Once the 24-hour post-delivery window completes, funds are transferred directly into your registered bank account via Paystack transfer.",
  },
];

export default function HelpDeskPage() {
  const { data: session } = useSession();

  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "General Inquiry",
    orderId: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<{ ticketId: string; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        name: f.name || session.user.name || "",
        email: f.email || session.user.email || "",
      }));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit ticket. Please try again.");
        return;
      }

      setTicketResult({
        ticketId: data.ticketId,
        message: data.message,
      });
      setForm({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        category: "General Inquiry",
        orderId: "",
        subject: "",
        message: "",
      });
    } catch {
      setSubmitting(false);
      setErrorMsg("An unexpected error occurred. Please check your internet connection.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf8e8]/40 via-white to-gray-50 pb-20">
      {/* ── Sub-header / Breadcrumb Bar ── */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#111111] transition-colors">Home</Link>
            <span>/</span>
            <span className="font-semibold text-gray-900">Help Desk &amp; Contact Support</span>
          </div>
          <Link href="/products" className="text-[#A4860E] hover:underline font-semibold flex items-center gap-1">
            <i className="fa-solid fa-arrow-left text-[10px]" /> Back to Shopping
          </Link>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-8 text-center">
        <div className="w-16 h-16 bg-[#fdf8e8] border border-[#e8d48a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <i className="fa-solid fa-[#A4860E] text-[#A4860E] text-2xl" />
          <i className="fa-solid fa-headset text-[#A4860E] text-2xl" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          Campus<span className="text-[#A4860E]">Go</span> Help Desk
        </h1>
        <p className="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
          Need assistance with an order, delivery PIN, payment release, or account question? Send a ticket directly to the admin team below.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* ── Left Column: Contact Form (7 cols) ── */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Submit a Support Ticket</h2>
                <p className="text-xs text-gray-500 mt-0.5">We typically respond within 2 to 4 hours.</p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Support
              </span>
            </div>

            {ticketResult ? (
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-md">
                  <i className="fa-solid fa-check" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Ticket Submitted Successfully!</h3>
                <p className="text-xs font-mono font-bold text-[#A4860E] bg-white border border-[#e8d48a] inline-block px-3 py-1 rounded-lg mb-3">
                  Ticket Ref: #{ticketResult.ticketId}
                </p>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {ticketResult.message}
                </p>
                <button
                  onClick={() => setTicketResult(null)}
                  className="px-6 py-2.5 bg-[#A4860E] text-white text-sm font-semibold rounded-xl hover:bg-[#8a7009] transition-colors"
                >
                  Submit Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation text-sm" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Chukwuma Emmanuel"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#A4860E] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. chukwuma@gmail.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#A4860E] transition-colors"
                    />
                  </div>
                </div>

                {/* Category & Order ID Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#A4860E] bg-white cursor-pointer transition-colors"
                    >
                      <option value="Order Inquiry">Order Inquiry</option>
                      <option value="Delivery PIN & Verification">Delivery PIN &amp; Verification</option>
                      <option value="Payment & Payout Issue">Payment &amp; Payout Issue</option>
                      <option value="Account & Verification (NIN)">Account &amp; Verification (NIN)</option>
                      <option value="Report Seller or Fraud">Report Seller or Fraud</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Order ID <span className="text-gray-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.orderId}
                      onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                      placeholder="e.g. 64b8f1a23..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#A4860E] font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Subject Line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#A4860E] transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Detailed Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Please describe your issue in detail. Include any relevant tracking numbers, product names, or transaction references..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#A4860E] transition-colors resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#A4860E] text-white font-bold text-base hover:bg-[#8a7009] transition-colors shadow-md shadow-[#A4860E]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin" />
                      <span>Sending Ticket...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane" />
                      <span>Submit Ticket to Admin</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Right Column: Info & FAQs (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Quick Contact Box */}
          <div className="bg-gradient-to-br from-[#fdf8e8] to-[#fffbeb] rounded-2xl border border-[#e8d48a] p-6">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-envelope text-[#A4860E]" /> Direct Admin Contact
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Have an urgent safety concern or platform emergency? Reach our support desk directly via email or check platform guidelines.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-white/80 rounded-xl border border-[#e8d48a]/50">
                <span className="text-gray-500 font-medium">Support Email:</span>
                <a href="mailto:support@campusgo.ng" className="font-bold text-[#A4860E] hover:underline">
                  support@campusgo.ng
                </a>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white/80 rounded-xl border border-[#e8d48a]/50">
                <span className="text-gray-500 font-medium">Response Time:</span>
                <span className="font-bold text-green-700">Within 24 Hours</span>
              </div>
            </div>
          </div>

          {/* Legal Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-scale-balanced text-gray-500" /> Platform Legal &amp; Policies
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/terms"
                className="p-3 bg-gray-50 hover:bg-amber-50/60 rounded-xl border border-gray-100 hover:border-amber-200 transition-all text-center group"
              >
                <i className="fa-solid fa-file-contract text-gray-400 group-hover:text-[#A4860E] text-base mb-1.5 block" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-[#A4860E] block">Terms &amp; Conditions</span>
              </Link>
              <Link
                href="/privacy"
                className="p-3 bg-gray-50 hover:bg-amber-50/60 rounded-xl border border-gray-100 hover:border-amber-200 transition-all text-center group"
              >
                <i className="fa-solid fa-shield-halved text-gray-400 group-hover:text-[#A4860E] text-base mb-1.5 block" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-[#A4860E] block">Privacy Policy</span>
              </Link>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-circle-question text-gray-500" /> Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left text-xs font-bold text-gray-800 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <i className={`fa-solid fa-chevron-down text-[10px] text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#A4860E]" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-2.5 bg-gray-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
