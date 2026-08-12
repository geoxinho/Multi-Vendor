"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConfirmDeliveryFormProps {
  orderId: string;
  onSuccess?: () => void;
}

export default function ConfirmDeliveryForm({ orderId, onSuccess }: ConfirmDeliveryFormProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError("PIN must be exactly 6 digits.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to confirm delivery. Please verify the PIN and try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2">
        <i className="fa-solid fa-circle-check text-lg shrink-0" style={{ color: "#A4860E" }} />
        <span>Delivery verified & confirmed successfully! <i className="fa-solid fa-champagne-glasses text-green-600" /></span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50/50 to-yellow-50/30 rounded-2xl border border-green-100 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-green-800 flex items-center gap-2 mb-2">
        <i className="fa-solid fa-box text-green-600" />
        <span>Confirm Delivery Receipt</span>
      </h3>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Please ask the buyer for their **6-digit delivery PIN** that was sent to their email. Enter the PIN below to confirm you have successfully delivered the package.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            required
            maxLength={6}
            placeholder="Enter 6-digit PIN"
            className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-gray-200 focus:outline-none transition font-mono tracking-widest text-center sm:text-left"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <button
          type="submit"
          disabled={loading || pin.length !== 6}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
        >
          {loading ? "Verifying..." : "Confirm Delivery"}
        </button>
      </form>
      
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-3 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
          <i className="fa-solid fa-circle-xmark text-sm shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
