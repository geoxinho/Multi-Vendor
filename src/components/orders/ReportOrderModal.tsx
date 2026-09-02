"use client";

import { useState } from "react";

interface ReportOrderModalProps {
  orderId: string;
  role: "buyer" | "seller";
  onClose: () => void;
  onSuccess?: () => void;
}

const BUYER_REASONS = [
  "Item not received / Missing delivery",
  "Damaged or defective item received",
  "Wrong item or specification mismatch",
  "Seller requested off-platform PIN or payment",
  "Seller unresponsive to messages / delayed delivery",
  "Other order / delivery abnormality",
];

const SELLER_REASONS = [
  "Buyer unreachable / delivery failed",
  "Buyer refusing to confirm valid PIN after delivery",
  "Incorrect delivery hostel / address details provided",
  "Buyer harassment or fraudulent dispute",
  "Other order / delivery abnormality",
];

export default function ReportOrderModal({
  orderId,
  role,
  onClose,
  onSuccess,
}: ReportOrderModalProps) {
  const reasonList = role === "buyer" ? BUYER_REASONS : SELLER_REASONS;

  const [reason, setReason] = useState(reasonList[0]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Please provide a subject and detailed explanation.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          reason,
          subject: subject.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to submit report");
      } else {
        setSubmitted(true);
        if (onSuccess) onSuccess();
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-white text-sm" />
              </div>
              <div>
                <h3 className="font-bold text-base">Report Order Issue to Admin</h3>
                <p className="text-red-100 text-xs font-mono">Order #{orderId.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition">
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-check" />
            </div>
            <h4 className="font-bold text-lg text-gray-900">Complaint Submitted to Admin</h4>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
              Our campus administration team has received your dispute report. An admin will investigate the issue and take necessary action.
              {role === "buyer" && " Payout for this order has been placed on hold pending review."}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Category of Abnormality <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
              >
                {reasonList.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Complaint Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Received incorrect phone charger color and cracked cover"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Detailed Explanation <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exactly what happened during delivery or with the item received..."
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition resize-none"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
              <i className="fa-solid fa-shield-halved text-amber-600 mt-0.5 shrink-0" />
              <span>
                CampusGo Admin investigates all reported delivery abnormalities to ensure safe trading across campuses.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane text-xs" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
