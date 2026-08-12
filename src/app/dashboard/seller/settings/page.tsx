"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import BankAccountVerifier from "@/components/seller/BankAccountVerifier";

interface SettingsData {
  phone: string;
  storeName: string;
  storeDescription: string;
  lastBrandNameChangeAt: string | null;
  bankDetails?: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
}

interface VerifiedAccount {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

export default function SellerSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const [settings, setSettings] = useState<SettingsData>({
    phone: "",
    storeName: "",
    storeDescription: "",
    lastBrandNameChangeAt: null,
  });

  const [daysUntilBrandChange, setDaysUntilBrandChange] = useState(0);
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/seller/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);

          if (data.lastBrandNameChangeAt) {
            const lastChange = new Date(data.lastBrandNameChangeAt);
            const now = new Date();
            const daysSinceChange =
              (now.getTime() - lastChange.getTime()) / (1000 * 3600 * 24);
            if (daysSinceChange < 365) {
              setDaysUntilBrandChange(Math.ceil(365 - daysSinceChange));
            }
          }
        } else {
          toast.error("Failed to load settings");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ── Store info submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: settings.phone,
          storeName: settings.storeName,
          storeDescription: settings.storeDescription,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Settings updated successfully!");
        if (daysUntilBrandChange === 0) {
          setSettings((prev) => ({
            ...prev,
            lastBrandNameChangeAt: new Date().toISOString(),
          }));
          setDaysUntilBrandChange(365);
        }
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  // ── Bank details submit ───────────────────────────────────────────
  const handleSaveBankDetails = async () => {
    if (!verifiedAccount) return;
    setSavingBank(true);

    try {
      const res = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankDetails: {
            bankName: verifiedAccount.bankName,
            bankCode: verifiedAccount.bankCode,
            accountNumber: verifiedAccount.accountNumber,
            accountName: verifiedAccount.accountName,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Bank details saved successfully! 🎉");
        setSettings((prev) => ({
          ...prev,
          bankDetails: {
            bankName: verifiedAccount.bankName,
            bankCode: verifiedAccount.bankCode,
            accountNumber: verifiedAccount.accountNumber,
            accountName: verifiedAccount.accountName,
          },
        }));
      } else {
        toast.error(data.error || "Failed to save bank details");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const handleVerified = useCallback((details: VerifiedAccount | null) => {
    setVerifiedAccount(details);
  }, []);

  const isBrandNameLocked = daysUntilBrandChange > 0;
  const hasSavedBankDetails = !!settings.bankDetails?.accountNumber;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#E5E5E5] border-t-[#A4860E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#111111]">Store Settings</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Manage your store&apos;s public details, contact information, and payout account.
        </p>
      </div>

      {/* ── Store Info Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5F5F5]">
          <h2 className="text-base font-bold text-[#111111]">Store Information</h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">Your public store details visible to buyers</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Personal Name (Read-Only) */}
          <div>
            <label className="block text-sm font-semibold text-[#111111] mb-1.5">
              Personal Name
            </label>
            <input
              type="text"
              value={session?.user?.name || ""}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#9B9B9B] cursor-not-allowed text-sm"
            />
            <p className="text-xs text-[#9B9B9B] mt-1">Your personal name cannot be changed.</p>
          </div>

          <hr className="border-[#F5F5F5]" />

          {/* Store Name */}
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-semibold text-[#111111]">
                Brand / Store Name
              </label>
              {isBrandNameLocked && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Locked for {daysUntilBrandChange} days
                </span>
              )}
            </div>

            <input
              type="text"
              value={settings.storeName}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, storeName: e.target.value }))
              }
              disabled={isBrandNameLocked}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] transition-colors text-sm ${
                isBrandNameLocked
                  ? "border-[#E5E5E5] bg-[#FAFAFA] text-[#9B9B9B] cursor-not-allowed"
                  : "border-[#E5E5E5] bg-white"
              }`}
            />
            <p className="text-xs text-[#9B9B9B] mt-1">
              You can only change your brand name once every 365 days to maintain customer trust.
            </p>
          </div>

          {/* Store Description */}
          <div>
            <label className="block text-sm font-semibold text-[#111111] mb-1.5">
              Store Description
            </label>
            <textarea
              rows={4}
              value={settings.storeDescription}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, storeDescription: e.target.value }))
              }
              placeholder="Tell buyers about your brand and what you sell..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] bg-white transition-colors resize-none text-sm"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-[#111111] mb-1.5">
              Contact Phone Number
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="e.g. 08012345678"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] bg-white transition-colors text-sm"
            />
            <p className="text-xs text-[#9B9B9B] mt-1">
              This number is used to contact you regarding your orders.
            </p>
          </div>

          <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#A4860E] text-white font-semibold rounded-xl hover:bg-[#8a6f0b] active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Bank Details Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5F5F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center">
              <i className="fa-solid fa-building-columns text-[#A4860E] text-sm" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111111]">Payout Bank Account</h2>
              <p className="text-xs text-[#9B9B9B]">Where your earnings will be transferred after each sale</p>
            </div>
          </div>
        </div>

        {/* Currently saved bank — shown as a read-only badge */}
        {hasSavedBankDetails && (
          <div className="mx-6 mt-5 flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-[#A4860E] flex items-center justify-center shrink-0">
              <i className="fa-solid fa-check text-white text-xs" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#8a6f0b] uppercase tracking-wide">Current Payout Account</p>
              <p className="text-sm font-bold text-[#111111] truncate">
                {settings.bankDetails!.accountName}
              </p>
              <p className="text-xs text-[#6B6B6B]">
                {settings.bankDetails!.bankName} · ****{settings.bankDetails!.accountNumber.slice(-4)}
              </p>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Payout info banner */}
          <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-[#fdf8e8] border border-[#BFDBFE] rounded-xl">
            <i className="fa-solid fa-circle-info text-[#A4860E] text-sm mt-0.5 shrink-0" />
            <p className="text-xs text-[#A4860E] leading-relaxed">
              Your payout is released <strong>3 days</strong> after a buyer confirms delivery. 
              Make sure your account details are correct to avoid payment delays.
            </p>
          </div>

          {/* The verifier widget */}
          <BankAccountVerifier
            onVerified={handleVerified}
            initialBankCode={settings.bankDetails?.bankCode}
            initialBankName={settings.bankDetails?.bankName}
            initialAccountNumber={settings.bankDetails?.accountNumber}
          />

          {/* Save Bank Details button */}
          <div className="mt-6 pt-5 border-t border-[#F5F5F5]">
            <button
              type="button"
              onClick={handleSaveBankDetails}
              disabled={!verifiedAccount || savingBank}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                verifiedAccount && !savingBank
                  ? "bg-[#A4860E] hover:bg-[#8a6f0b] text-white shadow-sm active:scale-95"
                  : "bg-[#F5F5F5] text-[#9B9B9B] cursor-not-allowed"
              }`}
            >
              {savingBank ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : verifiedAccount ? (
                <>
                  <i className="fa-solid fa-floppy-disk" />
                  Save Bank Details
                </>
              ) : (
                <>
                  <i className="fa-solid fa-lock" />
                  Verify account to enable saving
                </>
              )}
            </button>
            {!verifiedAccount && (
              <p className="text-xs text-center text-[#9B9B9B] mt-2">
                Select your bank and enter your 10-digit account number to verify first
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
