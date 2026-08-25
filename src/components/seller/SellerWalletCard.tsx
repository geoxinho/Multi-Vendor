"use client";

import { useState } from "react";
import Link from "next/link";

interface BankDetails {
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

interface SellerWalletCardProps {
  availableBalance: number;
  pendingBalance: number;
  heldBalance?: number;
  totalEarned: number;
  hasBankDetails: boolean;
  bankDetails?: BankDetails;
  hasHeldOrders?: boolean;
  onWithdrawSuccess?: () => void;
}

export default function SellerWalletCard({
  availableBalance,
  pendingBalance,
  heldBalance = 0,
  totalEarned,
  hasBankDetails,
  bankDetails,
  hasHeldOrders = false,
  onWithdrawSuccess,
}: SellerWalletCardProps) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState<string>(availableBalance.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isHeld = hasHeldOrders || heldBalance > 0;
  const lockedTotal = isHeld ? (heldBalance + pendingBalance) : pendingBalance;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid withdrawal amount.");
      return;
    }

    if (val > availableBalance) {
      setError(`Amount exceeds your available balance of ₦${availableBalance.toLocaleString()}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/seller/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Withdrawal failed.");
        setLoading(false);
        return;
      }

      setSuccessMsg(data.message || "Withdrawal processed successfully!");
      setLoading(false);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setSuccessMsg("");
        if (onWithdrawSuccess) onWithdrawSuccess();
        window.location.reload();
      }, 1800);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden mb-8">
      {/* Background Glow Overlay */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#A4860E]/20 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Notification: Money is Held by Admin ── */}
      {isHeld && (
        <div className="mb-6 bg-amber-500/20 border border-amber-400/50 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
            <i className="fa-solid fa-lock text-base" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-extrabold text-amber-300">
                Payout Held by Admin
              </p>
              <span className="bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Under Review
              </span>
            </div>
            <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
              One or more of your transactions have been temporarily placed on hold by the administrator. 
              The money remains safely in escrow and cannot be withdrawn until the admin releases the hold. 
              An email notification explaining the review has been sent to your inbox.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#A4860E]/20 text-[#F0C040] flex items-center justify-center text-sm border border-[#A4860E]/30">
              <i className="fa-solid fa-wallet" />
            </span>
            <h2 className="text-lg font-extrabold text-white tracking-wide">Seller Wallet</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            95% net payout enters your wallet upon purchase. 24-hr unlock applies after delivery.
          </p>
        </div>

        {/* Withdraw CTA Button */}
        {hasBankDetails ? (
          <button
            onClick={() => {
              setAmount(availableBalance.toString());
              setError("");
              setShowWithdrawModal(true);
            }}
            disabled={availableBalance <= 0}
            className="px-6 py-3 bg-[#A4860E] hover:bg-[#b59510] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-[#A4860E]/30 text-sm flex items-center justify-center gap-2.5 shrink-0"
          >
            <i className="fa-solid fa-building-columns" />
            Withdraw Earnings
          </button>
        ) : (
          <Link
            href="/dashboard/seller/settings"
            className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-2xl transition-all text-xs flex items-center justify-center gap-2 shrink-0"
          >
            <i className="fa-solid fa-triangle-exclamation text-amber-400" />
            Add Bank Details to Withdraw
          </Link>
        )}
      </div>

      {/* Balance Grid (3-Column Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Available to Withdraw
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-3xl font-black text-white">₦{availableBalance.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">Ready for instant payout to bank</p>
        </div>

        {/* Pending / Held by Admin Balance */}
        <div
          className={`rounded-2xl p-5 backdrop-blur-sm border transition-all ${
            isHeld
              ? "bg-amber-500/10 border-amber-500/40"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isHeld ? "text-amber-400 font-bold" : "text-[#F0C040]"
              }`}
            >
              {isHeld ? "Held by Admin" : "Pending (24h Lock)"}
            </span>
            {isHeld ? (
              <i className="fa-solid fa-lock text-amber-400 text-xs" />
            ) : (
              <i className="fa-solid fa-hourglass-half text-[#F0C040] text-xs" />
            )}
          </div>
          <p className="text-3xl font-black text-white">
            ₦{lockedTotal.toLocaleString()}
          </p>
          <p className={`text-[11px] mt-1 ${isHeld ? "text-amber-300/80 font-medium" : "text-gray-400"}`}>
            {isHeld
              ? (heldBalance > 0 && pendingBalance > 0
                  ? `₦${heldBalance.toLocaleString()} on hold · ₦${pendingBalance.toLocaleString()} in 24h lock`
                  : "Transaction under review by admin")
              : "Unlocks 24h after delivery confirmation"}
          </p>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Net Earned
            </span>
            <i className="fa-solid fa-trophy text-[#A4860E] text-xs" />
          </div>
          <p className="text-3xl font-black text-white">₦{totalEarned.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">Lifetime earnings (after 5% platform fee)</p>
        </div>
      </div>

      {/* ── Withdrawal Modal ── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-gray-900">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in relative">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#fdf8e8] border border-[#e8d48a] rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#A4860E]">
                <i className="fa-solid fa-building-columns text-2xl" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Withdraw to Bank Account</h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter the amount you would like to transfer to your bank.
              </p>
            </div>

            {/* Bank Details Card Preview */}
            {bankDetails && (
              <div className="bg-[#fdf8e8] border border-[#e8d48a] rounded-2xl p-4 mb-5 text-xs">
                <p className="font-bold text-[#A4860E] uppercase text-[10px] tracking-wider mb-1">
                  Destination Bank Account
                </p>
                <p className="font-extrabold text-gray-900 text-sm">{bankDetails.accountName}</p>
                <p className="text-gray-600 font-medium mt-0.5">
                  {bankDetails.bankName} &bull;{" "}
                  <span className="font-mono">{bankDetails.accountNumber}</span>
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-sm shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-sm shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Withdrawal Amount (₦)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(availableBalance.toString())}
                    className="text-[11px] font-bold text-[#A4860E] hover:underline"
                  >
                    Max (₦{availableBalance.toLocaleString()})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={availableBalance}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-base font-extrabold text-gray-900 focus:ring-2 focus:ring-[#A4860E] outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Available: <span className="font-bold text-emerald-600">₦{availableBalance.toLocaleString()}</span>
                  {isHeld && (
                    <> &nbsp;·&nbsp; Held: <span className="font-bold text-amber-600">₦{heldBalance.toLocaleString()}</span> (locked under admin review)</>
                  )}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || availableBalance <= 0}
                className="w-full py-3.5 bg-[#A4860E] hover:bg-[#8a7009] text-white font-extrabold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin" /> Processing Payout...
                  </>
                ) : (
                  `Withdraw ₦${Number(amount || 0).toLocaleString()} Now`
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
