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
        <div className="bg-gradient-to-r from-[#A4860E] to-[#c9a820] px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Become a Seller</h2>
              <p className="text-yellow-100 text-xs mt-0.5">Start selling products on CampusGo</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors flex items-center justify-center">
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            {[
              { icon: <i className="fa-solid fa-box text-[#A4860E] text-xl" />, label: "List products" },
              { icon: <i className="fa-solid fa-money-bill-wave text-[#A4860E] text-xl" />, label: "Earn payouts" },
              { icon: <i className="fa-solid fa-shield text-[#A4860E] text-xl" />, label: "Secure trade" }
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                {b.icon}
                <span className="text-[10px] font-semibold text-gray-600 mt-1">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Store Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Store Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Joy's Campus Shop"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white transition"
              value={form.storeName}
              onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
            />
          </div>

          {/* Store Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Store Description (Optional)</label>
            <textarea
              placeholder="Tell buyers what you sell..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white transition resize-none"
              value={form.storeDescription}
              onChange={(e) => setForm((f) => ({ ...f, storeDescription: e.target.value }))}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium flex items-center gap-1.5">
              <i className="fa-solid fa-circle-exclamation text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#A4860E] text-white font-bold text-sm hover:bg-[#8a7009] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin text-sm" />
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
