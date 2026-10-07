"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Bank {
  name: string;
  code: string;
  slug: string;
}

interface BecomeSellerModalProps {
  onClose: () => void;
}

export default function BecomeSellerModal({ onClose }: BecomeSellerModalProps) {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    storeName: "",
    storeDescription: "",
    sellerCategory: "",
    school: session?.user?.school || "",
    passport: session?.user?.passport || session?.user?.image || "",
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });

  const [passportPreview, setPassportPreview] = useState(session?.user?.passport || session?.user?.image || "");
  const [passportUploading, setPassportUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* Categories, Schools & Banks */
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [schools, setSchools] = useState<{ _id: string; name: string }[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoaded, setBanksLoaded] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [bankSuggestions, setBankSuggestions] = useState<Bank[]>([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [manualAccountEntry, setManualAccountEntry] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const bankRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCategories(d); })
      .catch(() => {});

    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSchools(d); })
      .catch(() => {});

    fetch("/api/banks")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.banks) && d.banks.length > 0) setBanks(d.banks);
        setBanksLoaded(true);
      })
      .catch(() => { setBanksLoaded(true); });
  }, []);

  /* Close bank dropdown on click outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bankRef.current && !bankRef.current.contains(e.target as Node)) {
        setShowBankDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBankQueryChange = (q: string) => {
    setBankQuery(q);
    setForm((f) => ({ ...f, bankName: "", bankCode: "", accountName: "" }));
    setAccountVerified(false);
    setVerifyError("");
    if (q.length >= 2) {
      const filtered = banks
        .filter((b) => b.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 7);
      setBankSuggestions(filtered);
      setShowBankDropdown(filtered.length > 0);
    } else {
      setBankSuggestions([]);
      setShowBankDropdown(false);
    }
  };

  const selectBank = (bank: Bank) => {
    setBankQuery(bank.name);
    setForm((f) => ({ ...f, bankName: bank.name, bankCode: bank.code, accountName: "" }));
    setBankSuggestions([]);
    setShowBankDropdown(false);
    setAccountVerified(false);
    setManualAccountEntry(false);
    setVerifyError("");
  };

  /* Auto-verify when 10-digit account + bank code present */
  useEffect(() => {
    if (form.accountNumber.length === 10 && form.bankCode) {
      setVerifyingAccount(true);
      setAccountVerified(false);
      setManualAccountEntry(false);
      setVerifyError("");
      setForm((f) => ({ ...f, accountName: "" }));

      fetch("/api/auth/verify-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: form.accountNumber, bankCode: form.bankCode }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.accountName) {
            setForm((f) => ({ ...f, accountName: d.accountName }));
            setAccountVerified(true);
          } else if (d.manual) {
            setManualAccountEntry(true);
          } else {
            setVerifyError(d.error || "Account not found. Check the number and bank.");
          }
        })
        .catch(() => { setManualAccountEntry(true); })
        .finally(() => setVerifyingAccount(false));
    } else if (form.accountNumber.length < 10) {
      setAccountVerified(false);
      setManualAccountEntry(false);
      setVerifyError("");
      setForm((f) => ({ ...f, accountName: "" }));
    }
  }, [form.accountNumber, form.bankCode]);

  const handlePassportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setPassportUploading(true);
    setPassportPreview(URL.createObjectURL(file));
    setError("");

    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/auth/upload-passport", { method: "POST", body: data });
      const json = await res.json();
      if (json.url) {
        setForm((f) => ({ ...f, passport: json.url }));
      } else {
        setError(json.error ?? "Failed to upload passport photo.");
        setPassportPreview("");
      }
    } catch {
      setError("Failed to upload passport photo. Please check your connection.");
      setPassportPreview("");
    } finally {
      setPassportUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.storeName.trim()) {
      setError("Store name is required.");
      return;
    }
    if (!form.sellerCategory) {
      setError("Please select a primary product category.");
      return;
    }
    if (!form.passport) {
      setError("Passport photograph is required to become a seller.");
      return;
    }
    if (!form.bankName || !form.bankCode) {
      setError("Please select a bank for your payout details.");
      return;
    }
    if (form.accountNumber.length !== 10) {
      setError("Account number must be 10 digits.");
      return;
    }
    if (!form.accountName) {
      setError("Please verify your bank account before continuing.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/become-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      // Refresh session JWT with new role + roles and passport avatar
      await update({
        role: data.role,
        roles: data.roles,
        storeName: data.storeName,
        passport: data.passport,
        avatar: data.avatar,
        image: data.image,
      });

      onClose();
      router.push("/dashboard/seller");
    } catch {
      setLoading(false);
      setError("Failed to register as seller. Please try again.");
    }
  };

  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider";
  const inputClass = "w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-gray-50 focus:bg-white";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#A4860E] to-[#c9a820] px-6 py-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-white/20">
                  Seller Onboarding
                </span>
              </div>
              <h2 className="text-xl font-black mt-1">Become a Verified Seller</h2>
              <p className="text-yellow-100 text-xs mt-0.5">
                Complete your store details and bank account to start selling
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Store Name */}
          <div>
            <label className={labelClass}>
              Store Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <i className="fa-solid fa-store absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                required
                placeholder="e.g. Joy's Campus Gadgets"
                className={inputClass}
                value={form.storeName}
                onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
              />
            </div>
          </div>

          {/* Primary Category & Campus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                Primary Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <i className="fa-solid fa-layer-group absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <select
                  required
                  value={form.sellerCategory}
                  onChange={(e) => setForm((f) => ({ ...f, sellerCategory: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-gray-50 focus:bg-white"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="General/Other">General / Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Campus / School <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <i className="fa-solid fa-graduation-cap absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <select
                  required
                  value={form.school}
                  onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-gray-50 focus:bg-white"
                >
                  <option value="" disabled>Select your campus</option>
                  {schools.map((s) => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Store Description */}
          <div>
            <label className={labelClass}>Store Description (Optional)</label>
            <textarea
              placeholder="Tell student buyers what products you sell..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#A4860E] transition resize-none text-gray-900 placeholder:text-gray-400"
              value={form.storeDescription}
              onChange={(e) => setForm((f) => ({ ...f, storeDescription: e.target.value }))}
            />
          </div>

          {/* Passport Photograph */}
          <div>
            <label className={labelClass}>
              Passport Photograph <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center hover:border-[#A4860E]/50 transition relative">
              {passportPreview ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="relative w-14 h-16 rounded-lg overflow-hidden border border-[#e8d48a] shrink-0">
                    <Image src={passportPreview} alt="Passport preview" fill className="object-cover" />
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-bold text-gray-900">Photo selected</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {passportUploading ? (
                        <span className="text-[#A4860E] flex items-center gap-1 font-semibold">
                          <i className="fa-solid fa-circle-notch animate-spin text-[10px]" /> Uploading…
                        </span>
                      ) : (
                        <span className="text-[#A4860E] font-semibold">✓ Photo ready (Click to change)</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <i className="fa-solid fa-camera text-2xl text-[#A4860E] mb-1" />
                  <p className="text-xs font-bold text-gray-900">Upload your passport photograph</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Clear face photo · JPG, PNG · Max 5MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                required={!form.passport}
                disabled={passportUploading}
                onChange={handlePassportChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>

          {/* Bank Details Section for Payouts */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-building-columns text-[#A4860E]" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Bank Details for Payouts
              </span>
            </div>

            <div className="space-y-3">
              {/* Searchable Bank */}
              <div ref={bankRef} className="relative">
                <label className={labelClass}>
                  Bank Name <span className="text-red-500">*</span>
                </label>
                {!banksLoaded ? (
                  <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 flex items-center gap-2">
                    <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                    Loading banks…
                  </div>
                ) : banks.length > 0 ? (
                  <div className="relative">
                    <i className="fa-solid fa-landmark absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={bankQuery || form.bankName}
                      onChange={(e) => handleBankQueryChange(e.target.value)}
                      onFocus={() => bankSuggestions.length > 0 && setShowBankDropdown(true)}
                      placeholder="Type to search your bank…"
                      autoComplete="off"
                      className={inputClass}
                    />
                    {form.bankCode && (
                      <i className="fa-solid fa-circle-check absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A4860E] text-xs" />
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <i className="fa-solid fa-landmark absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value, bankCode: e.target.value }))}
                      placeholder="e.g. Access Bank"
                      className={inputClass}
                    />
                  </div>
                )}

                {/* Bank Suggestions Dropdown */}
                {showBankDropdown && bankSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden max-h-48 overflow-y-auto">
                    {bankSuggestions.map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); selectBank(b); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#fdf8e8] text-left transition-colors"
                      >
                        <i className="fa-solid fa-building-columns text-[10px] text-[#A4860E]" />
                        <span className="text-xs text-gray-900 font-medium">{b.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 10-Digit Account Number */}
              <div>
                <label className={labelClass}>
                  Account Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="fa-solid fa-hashtag absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    required
                    value={form.accountNumber}
                    onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
                    placeholder="10-digit NUBAN account number"
                    maxLength={10}
                    className={`${inputClass} font-mono tracking-wider`}
                  />
                  {verifyingAccount && (
                    <i className="fa-solid fa-circle-notch animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A4860E] text-xs" />
                  )}
                  {accountVerified && !verifyingAccount && (
                    <i className="fa-solid fa-circle-check absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A4860E] text-xs" />
                  )}
                </div>
              </div>

              {/* Verified Account Name */}
              <div>
                <label className={labelClass}>
                  Account Name <span className="text-red-500">*</span>
                  {accountVerified && <span className="ml-2 text-[#A4860E] font-normal normal-case">✓ Verified</span>}
                </label>

                {verifyingAccount ? (
                  <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
                    <i className="fa-solid fa-circle-notch animate-spin text-xs text-[#A4860E]" />
                    Verifying account name with bank…
                  </div>
                ) : accountVerified ? (
                  <div className="w-full px-4 py-2.5 rounded-xl border border-[#A4860E] bg-[#fdf8e8] text-xs text-[#A4860E] font-bold flex items-center justify-between">
                    <span>{form.accountName}</span>
                    <i className="fa-solid fa-circle-check text-xs" />
                  </div>
                ) : manualAccountEntry ? (
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={form.accountName}
                      onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value.toUpperCase() }))}
                      placeholder="e.g. JOHN DOE"
                      className={`${inputClass} font-mono uppercase`}
                    />
                  </div>
                ) : (
                  <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-400">
                    Enter bank and 10-digit number to auto-verify
                  </div>
                )}

                {verifyError && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <i className="fa-solid fa-circle-xmark text-[10px]" />
                    {verifyError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payout Policy Notice */}
          <div className="p-3 bg-[#fdf8e8] border border-[#e8d48a] rounded-xl flex items-start gap-2.5">
            <i className="fa-solid fa-shield-halved text-[#A4860E] text-xs mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#7a6310] leading-relaxed">
              <strong>Payout Escrow:</strong> Earnings from confirmed orders are credited directly to your bank account 24 hours after buyer delivery confirmation.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || passportUploading || verifyingAccount}
              className="flex-1 py-3 rounded-xl bg-[#A4860E] text-white font-bold text-xs hover:bg-[#8a7009] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-[#A4860E]/20"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                  Creating Store…
                </>
              ) : (
                "Complete Seller Registration →"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
