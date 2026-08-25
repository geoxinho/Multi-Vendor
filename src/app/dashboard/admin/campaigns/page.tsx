"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type AudienceType = "all" | "buyers" | "sellers" | "abandoned_cart" | "inactive" | "custom";

interface CampaignItem {
  _id: string;
  subject: string;
  preheader?: string;
  audience: AudienceType;
  audienceLabel: string;
  recipientCount: number;
  htmlContent: string;
  ctaText?: string;
  ctaUrl?: string;
  sentBy?: { name?: string; email?: string };
  status: string;
  sentAt: string;
}

const AUDIENCE_OPTIONS: {
  id: AudienceType;
  label: string;
  description: string;
  icon: string;
  badgeColor: string;
}[] = [
  {
    id: "all",
    label: "All Registered Users",
    description: "Send to every active user on the platform",
    icon: "fa-solid fa-users",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "buyers",
    label: "All Buyers",
    description: "Target registered shoppers and buyers",
    icon: "fa-solid fa-bag-shopping",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "sellers",
    label: "All Sellers / Vendors",
    description: "Broadcast announcements to campus merchants",
    icon: "fa-solid fa-[#A4860E] fa-store",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    id: "abandoned_cart",
    label: "Abandoned Cart & Drop-offs",
    description: "Buyers with pending/failed orders or no completed purchase",
    icon: "fa-solid fa-cart-flatbed-suitcases",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: "inactive",
    label: "Inactive Users (30+ Days)",
    description: "Re-engage users who haven't ordered in over a month",
    icon: "fa-solid fa-user-clock",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
  },
  {
    id: "custom",
    label: "Custom Email List",
    description: "Paste a custom list of email addresses",
    icon: "fa-solid fa-list-check",
    badgeColor: "bg-gray-100 text-gray-800 border-gray-200",
  },
];

const TEMPLATES = [
  {
    name: "🛒 Cart Abandonment Recovery",
    subject: "You left something special in your cart! 🛍️",
    preheader: "Complete your order before items sell out on Adeleke Campus.",
    content:
      "Hi there!\n\nWe noticed you left items in your shopping cart. Don't miss out — items on CampusGo sell fast!\n\nClick below to return to your cart and complete your order with ease.",
    ctaText: "Complete My Order",
    ctaUrl: "https://campusgo.vercel.app/cart",
    recommendedAudience: "abandoned_cart" as AudienceType,
  },
  {
    name: "🎁 Special Campus Promo",
    subject: "🔥 Exclusive Deals Today on CampusGo!",
    preheader: "Save big on textbooks, fashion, food, and essentials.",
    content:
      "Hello Adeleke Campus Community!\n\nGreat news! Sellers have dropped prices on top campus essentials today.\n\nBrowse fresh items listed by verified campus sellers right now.",
    ctaText: "Explore Campus Deals",
    ctaUrl: "https://campusgo.vercel.app/products",
    recommendedAudience: "buyers" as AudienceType,
  },
  {
    name: "💤 We Miss You (Re-engagement)",
    subject: "We miss you on CampusGo! Here's what's new ✨",
    preheader: "Check out new items and fast campus deliveries.",
    content:
      "Hi there!\n\nIt's been a while since your last visit. CampusGo has added new features, fresh inventory, and fast 24-hour deliveries across Adeleke University.\n\nCome check out what's new today!",
    ctaText: "Return to CampusGo",
    ctaUrl: "https://campusgo.vercel.app",
    recommendedAudience: "inactive" as AudienceType,
  },
  {
    name: "🏪 Seller Update",
    subject: "📢 Important Update for CampusGo Sellers",
    preheader: "Tips to boost your sales and track your 24hr payouts.",
    content:
      "Dear Seller,\n\nThank you for being a valued vendor on CampusGo! Here are a few quick tips to boost your store sales:\n\n1. Upload clear photos of your items.\n2. Keep your stock levels updated.\n3. Respond quickly to buyer messages.\n\nCheck your seller dashboard to manage your inventory and view payout status.",
    ctaText: "Go to Seller Dashboard",
    ctaUrl: "https://campusgo.vercel.app/dashboard/seller",
    recommendedAudience: "sellers" as AudienceType,
  },
];

export default function AdminCampaignsPage() {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // Form State
  const [audience, setAudience] = useState<AudienceType>("all");
  const [customEmails, setCustomEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [content, setContent] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  // Audience Count Preview State
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientPreview, setRecipientPreview] = useState<string[]>([]);
  const [audienceLabel, setAudienceLabel] = useState("");
  const [loadingAudience, setLoadingAudience] = useState(false);

  // Sending & History State
  const [sending, setSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Fetch audience recipient count preview
  useEffect(() => {
    if (audience === "custom" && !customEmails.trim()) {
      setRecipientCount(0);
      setRecipientPreview([]);
      setAudienceLabel("Custom Email List (0 addresses)");
      return;
    }

    setLoadingAudience(true);
    const params = new URLSearchParams({ audience });
    if (audience === "custom") params.append("customEmails", customEmails);

    fetch(`/api/admin/campaigns/recipients?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.count !== undefined) {
          setRecipientCount(data.count);
          setRecipientPreview(data.preview || []);
          setAudienceLabel(data.label || "");
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingAudience(false));
  }, [audience, customEmails]);

  // Fetch campaign history when tab changes
  useEffect(() => {
    if (activeTab === "history") {
      setLoadingHistory(true);
      fetch("/api/admin/campaigns")
        .then((r) => r.json())
        .then((data) => {
          setCampaigns(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab]);

  const applyTemplate = (t: (typeof TEMPLATES)[0]) => {
    setSubject(t.subject);
    setPreheader(t.preheader);
    setContent(t.content);
    setCtaText(t.ctaText);
    setCtaUrl(t.ctaUrl);
    setAudience(t.recommendedAudience);
  };

  const handleSendCampaign = async () => {
    if (!subject.trim() || !content.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          preheader,
          audience,
          customEmails,
          content,
          ctaText,
          ctaUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to send campaign.");
        setSending(false);
        setShowConfirmModal(false);
        return;
      }

      setToastMessage(data.message || "Campaign sent successfully!");
      setShowConfirmModal(false);
      // Reset form
      setSubject("");
      setPreheader("");
      setContent("");
      setCtaText("");
      setCtaUrl("");
      setCustomEmails("");
      // Switch to history tab
      setActiveTab("history");
    } catch (err) {
      console.error(err);
      alert("Error sending campaign. Please check console.");
    } finally {
      setSending(false);
    }
  };

  // Preview HTML helper
  const renderPreviewHtml = () => {
    const formattedBody = content.includes("<")
      ? content
      : content
          .split("\n\n")
          .map((p) => `<p style="margin: 0 0 14px;">${p.replace(/\n/g, "<br/>")}</p>`)
          .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        ${preheader ? `<div style="background:#fef3c7;color:#92400e;padding:6px 16px;font-size:11px;text-align:center;">Preview Text: ${preheader}</div>` : ""}
        <div style="background: linear-gradient(135deg, #A4860E, #c9a72a); padding: 28px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900;">CampusGo</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 12px;">Adeleke University Campus Marketplace</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 18px; font-weight: 800; color: #111827; margin: 0 0 16px;">${subject || "Subject Line Preview"}</h2>
          <div style="color: #374151; font-size: 14px; line-height: 1.6;">
            ${formattedBody || "<p style='color:#9ca3af;'>Type your message content above...</p>"}
          </div>
          ${
            ctaText && ctaUrl
              ? `
            <div style="text-align: center; margin: 28px 0 12px;">
              <a href="${ctaUrl}" target="_blank" style="display: inline-block; background: #A4860E; color: white; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px;">
                ${ctaText}
              </a>
            </div>
          `
              : ""
          }
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">CampusGo · Adeleke University Campus Marketplace</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-xl" />
            <span className="font-bold text-sm">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage("")} className="text-white/80 hover:text-white">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <i className="fa-solid fa-paper-plane text-[#A4860E]" />
            Email Campaigns &amp; Broadcasts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Send targeted emails to buyers, sellers, abandoned carts, and inactive users.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "create" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="fa-solid fa-plus text-[#A4860E]" />
            New Campaign
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="fa-solid fa-clock-rotate-left" />
            Sent History
          </button>
        </div>
      </div>

      {activeTab === "create" ? (
        <div className="space-y-6">
          {/* ── 1. Audience Selector ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a] flex items-center justify-center text-xs">
                1
              </span>
              Select Target Audience
            </h2>
            <p className="text-xs text-gray-500 mb-4 ml-8">
              Choose who should receive this email broadcast.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAudience(opt.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    audience === opt.id
                      ? "border-[#A4860E] bg-[#fdf8e8]/60 ring-2 ring-[#A4860E]/20 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 border ${opt.badgeColor}`}
                    >
                      <i className={opt.icon} />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-gray-900 leading-snug">
                        {opt.label}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                  {audience === opt.id && (
                    <div className="absolute top-3 right-3 text-[#A4860E]">
                      <i className="fa-solid fa-circle-check text-base" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Emails Textarea */}
            {audience === "custom" && (
              <div className="mt-4 ml-1 space-y-2">
                <label className="block text-xs font-bold text-gray-600 uppercase">
                  Paste Custom Email Addresses
                </label>
                <textarea
                  value={customEmails}
                  onChange={(e) => setCustomEmails(e.target.value)}
                  placeholder="e.g. buyer1@gmail.com, buyer2@adeleke.edu.ng (separated by commas or newlines)"
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#A4860E] outline-none h-24 resize-none"
                />
              </div>
            )}

            {/* Live Recipient Count Banner */}
            <div className="mt-5 bg-[#fdf8e8] border border-[#e8d48a] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#A4860E] text-white flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-bullseye text-xs" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Target Audience:{" "}
                    <span className="text-[#A4860E] underline decoration-[#A4860E]">
                      {audienceLabel || "Selected Segment"}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {loadingAudience ? (
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <i className="fa-solid fa-circle-notch animate-spin text-xs" /> Calculating audience size...
                      </span>
                    ) : recipientCount !== null ? (
                      <>
                        <strong className="text-gray-900">{recipientCount}</strong> address
                        {recipientCount === 1 ? "" : "es"} match this filter.
                      </>
                    ) : (
                      "Calculating..."
                    )}
                  </p>
                </div>
              </div>

              {/* Sample Emails Pills */}
              {recipientPreview.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Preview:</span>
                  {recipientPreview.map((em, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[10px] font-mono text-gray-600"
                    >
                      {em}
                    </span>
                  ))}
                  {recipientCount && recipientCount > 5 && (
                    <span className="text-[10px] text-[#A4860E] font-bold">
                      +{recipientCount - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── 2. Quick Preset Templates ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a] flex items-center justify-center text-xs">
                  2
                </span>
                Quick Campaign Templates
              </h2>
              <span className="text-xs text-gray-400 font-medium">Click to autofill form</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {TEMPLATES.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="p-3 bg-gray-50 hover:bg-[#fdf8e8] border border-gray-200 hover:border-[#e8d48a] rounded-xl text-left transition-colors group"
                >
                  <p className="text-xs font-bold text-gray-900 group-hover:text-[#A4860E] transition-colors">
                    {t.name}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{t.subject}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── 3. Campaign Content Form ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a] flex items-center justify-center text-xs">
                3
              </span>
              Compose Campaign Message
            </h2>

            {/* Subject Line */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. 🔥 Flash Sale: 20% Off Textbooks Today on CampusGo!"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#A4860E] outline-none font-medium"
              />
            </div>

            {/* Preheader / Subtitle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Preheader / Preview Subtitle <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                placeholder="e.g. Limited time offer for Adeleke University students."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-[#A4860E] outline-none"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Content <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your email announcement or message here..."
                rows={7}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#A4860E] outline-none resize-y leading-relaxed font-sans"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Tip: Paragraph breaks will automatically format into clean email spacing.
              </p>
            </div>

            {/* Call to Action Button Options */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  CTA Button Label <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. Shop Deals Now"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-[#A4860E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  CTA Button URL <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="e.g. https://campusgo.vercel.app/products"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-[#A4860E] outline-none"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="border-t border-gray-100 pt-5 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
              >
                <i className="fa-solid fa-eye text-gray-500" />
                Live Email Preview
              </button>

              <button
                type="button"
                disabled={!subject.trim() || !content.trim() || recipientCount === 0 || sending}
                onClick={() => setShowConfirmModal(true)}
                className="px-7 py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className="fa-solid fa-paper-plane" />
                Send Broadcast ({recipientCount ?? 0} Recipients)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── 4. Sent Campaign History Tab ── */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {loadingHistory ? (
            <LoadingSpinner className="py-24" size="lg" />
          ) : campaigns.length === 0 ? (
            <div className="p-16 text-center text-gray-400 text-sm">
              <i className="fa-solid fa-inbox text-3xl mb-3 text-gray-300 block" />
              No email campaigns sent yet. Click &quot;New Campaign&quot; to create your first broadcast!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Subject Line
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Target Audience
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date Sent
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-gray-900 truncate max-w-xs">
                        {c.subject}
                        {c.preheader && (
                          <span className="block text-[11px] font-normal text-gray-400 truncate">
                            {c.preheader}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-[#fdf8e8] border border-[#e8d48a] text-[#A4860E] text-xs font-bold rounded-full">
                          {c.audienceLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-800">
                        {c.recipientCount.toLocaleString()} emails
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        {new Date(c.sentAt).toLocaleString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="badge bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <i className="fa-solid fa-check text-xs" /> Sent
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Live Email Preview Modal ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <i className="fa-solid fa-eye text-[#A4860E]" />
                Live Email Preview
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="fa-solid fa-xmark text-base" />
              </button>
            </div>
            <div
              className="p-6 overflow-y-auto bg-gray-100 flex-1"
              dangerouslySetInnerHTML={{ __html: renderPreviewHtml() }}
            />
            <div className="px-6 py-3 border-t border-gray-100 text-right bg-white">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-gray-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Broadcast Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-14 h-14 bg-[#fdf8e8] border border-[#e8d48a] rounded-full flex items-center justify-center mx-auto mb-4 text-[#A4860E]">
              <i className="fa-solid fa-paper-plane text-2xl" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Send Broadcast Campaign?</h3>
            <p className="text-xs text-gray-500 mb-4">
              You are about to send this email to{" "}
              <strong className="text-gray-900 font-bold">{recipientCount} recipients</strong> in{" "}
              <span className="text-[#A4860E] font-bold">&quot;{audienceLabel}&quot;</span>.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left text-xs space-y-1 mb-5">
              <p className="font-bold text-gray-800 truncate">Subject: {subject}</p>
              {preheader && <p className="text-gray-500 truncate">Preheader: {preheader}</p>}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={sending}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCampaign}
                disabled={sending}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#A4860E] hover:bg-[#8a6f0b] rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
              >
                {sending ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin" /> Sending Broadcast...
                  </>
                ) : (
                  "Confirm & Send Now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
