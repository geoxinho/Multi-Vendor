"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BecomeSellerModalProps {
  onClose: () => void;
}

export default function BecomeSellerModal({ onClose }: BecomeSellerModalProps) {
  const { update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ storeName: "", storeDescription: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/user/become-seller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }

    // Refresh session JWT with new role + roles
    await update({ role: data.role, roles: data.roles });
    onClose();
    router.push("/dashboard/seller");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Become a Seller</h2>
              <p className="text-green-100 text-xs mt-0.5">Start selling products on CampusGo</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            {[
              { icon: <i className="fa-solid fa-box text-green-600 text-xl" />, label: "List products" },
              { icon: <i className="fa-solid fa-money-bill-wave text-green-600 text-xl" />, label: "Earn payouts" },
              { icon: <i className="fa-solid fa-chart-bar text-green-600 text-xl" />, label: "Track orders" },
            ].map((b) => (
              <div key={b.label} className="bg-green-50 rounded-xl p-3 text-center">
                <p className="mb-1 flex justify-center">{b.icon}</p>
                <p className="text-xs font-medium text-green-700">{b.label}</p>
              </div>
            ))}
          </div>

          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
              placeholder="e.g. Chidi's Electronics"
              required
              minLength={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>

          {/* Store Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Description</label>
            <textarea
              value={form.storeDescription}
              onChange={(e) => setForm((f) => ({ ...f, storeDescription: e.target.value }))}
              placeholder="Tell buyers what you sell..."
              required
              minLength={10}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Setting up…
                </>
              ) : (
                "Start Selling →"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
