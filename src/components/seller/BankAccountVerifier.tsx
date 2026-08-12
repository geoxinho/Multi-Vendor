"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Bank {
  name: string;
  code: string;
  slug: string;
}

interface VerifiedAccount {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

interface BankAccountVerifierProps {
  /** Called once verification succeeds. Pass null to clear. */
  onVerified: (details: VerifiedAccount | null) => void;
  /** Optional initial values (e.g. when editing) */
  initialBankCode?: string;
  initialBankName?: string;
  initialAccountNumber?: string;
}

export default function BankAccountVerifier({
  onVerified,
  initialBankCode = "",
  initialBankName = "",
  initialAccountNumber = "",
}: BankAccountVerifierProps) {
  // ── State ─────────────────────────────────────────────────────────
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState("");

  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [bankCode, setBankCode] = useState(initialBankCode);
  const [bankName, setBankName] = useState(initialBankName);
  const [search, setSearch] = useState(initialBankName);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load bank list once ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/banks");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load banks");
        setBanks(json.banks);
      } catch (e: unknown) {
        setBanksError(e instanceof Error ? e.message : "Failed to load banks");
      } finally {
        setBanksLoading(false);
      }
    };
    load();
  }, []);

  // ── Close dropdown when clicking outside ─────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Filtered bank list ────────────────────────────────────────────
  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Trigger verification when both fields are ready ───────────────
  const verify = useCallback(
    async (acctNum: string, bCode: string, bName: string) => {
      if (acctNum.length !== 10 || !bCode) return;

      setVerifying(true);
      setVerifyError("");
      setVerifiedAccount(null);
      onVerified(null); // Clear parent state while re-verifying

      try {
        const res = await fetch("/api/verify-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountNumber: acctNum, bankCode: bCode }),
        });
        const json = await res.json();

        if (!res.ok) {
          setVerifyError(json.error || "Verification failed. Please try again.");
          return;
        }

        const verified: VerifiedAccount = {
          accountName: json.accountName,
          accountNumber: json.accountNumber,
          bankCode: bCode,
          bankName: bName,
        };
        setVerifiedAccount(verified);
        onVerified(verified);
      } catch {
        setVerifyError("Network error. Please check your connection and try again.");
      } finally {
        setVerifying(false);
      }
    },
    [onVerified]
  );

  // ── Debounced auto-verify on input change ─────────────────────────
  const scheduleVerify = useCallback(
    (acctNum: string, bCode: string, bName: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // Clear stale results immediately
      setVerifiedAccount(null);
      setVerifyError("");
      onVerified(null);
      if (acctNum.length === 10 && bCode) {
        debounceRef.current = setTimeout(() => verify(acctNum, bCode, bName), 800);
      }
    },
    [verify, onVerified]
  );

  // ── Handlers ─────────────────────────────────────────────────────
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(val);
    scheduleVerify(val, bankCode, bankName);
  };

  const handleBankSelect = (bank: Bank) => {
    setBankCode(bank.code);
    setBankName(bank.name);
    setSearch(bank.name);
    setDropdownOpen(false);
    scheduleVerify(accountNumber, bank.code, bank.name);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // If user is typing a new search, clear the selected bank
    if (bankCode && e.target.value !== bankName) {
      setBankCode("");
      setBankName("");
      setVerifiedAccount(null);
      setVerifyError("");
      onVerified(null);
    }
    setDropdownOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Bank Selector ── */}
      <div>
        <label
          htmlFor="bank-search"
          className="block text-sm font-semibold text-[#111111] mb-1.5"
        >
          Bank Name <span className="text-red-500">*</span>
        </label>

        {banksLoading ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA]">
            <i className="fa-solid fa-circle-notch animate-spin text-[#A4860E] text-sm shrink-0" />
            <span className="text-sm text-[#9B9B9B]">Loading banks…</span>
          </div>
        ) : banksError ? (
          <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
            {banksError} —{" "}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] flex items-center justify-center">
                <i className="fa-solid fa-magnifying-glass text-xs" />
              </span>
              <input
                id="bank-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={handleSearchChange}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Search and select your bank…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#A4860E]/40 focus:border-[#A4860E] bg-white text-sm transition-colors"
              />
              {bankCode && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4860E] flex items-center justify-center">
                  <i className="fa-solid fa-check text-sm" />
                </span>
              )}
            </div>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-lg max-h-56 overflow-y-auto">
                {filteredBanks.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[#9B9B9B]">No banks found for &ldquo;{search}&rdquo;</p>
                ) : (
                  filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => handleBankSelect(bank)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#fdf8e8] transition-colors ${
                        bank.code === bankCode
                          ? "bg-[#fdf8e8] text-[#A4860E] font-semibold"
                          : "text-[#111111]"
                      }`}
                    >
                      {bank.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Account Number ── */}
      <div>
        <label
          htmlFor="account-number"
          className="block text-sm font-semibold text-[#111111] mb-1.5"
        >
          Account Number <span className="text-red-500">*</span>
        </label>
        <input
          id="account-number"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={10}
          value={accountNumber}
          onChange={handleAccountNumberChange}
          placeholder="Enter 10-digit account number"
          className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#A4860E]/40 focus:border-[#A4860E] bg-white text-sm font-mono tracking-widest transition-colors"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-[#9B9B9B]">Digits only, exactly 10 characters</p>
          <p className={`text-xs font-mono ${accountNumber.length === 10 ? "text-[#A4860E]" : "text-[#9B9B9B]"}`}>
            {accountNumber.length}/10
          </p>
        </div>
      </div>

      {/* ── Verification Status ── */}
      {(verifying || verifyError || verifiedAccount) && (
        <div
          className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm ${
            verifying
              ? "bg-[#fdf8e8] border-[#BFDBFE] text-[#A4860E]"
              : verifiedAccount
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#8a6f0b]"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {verifying ? (
            <>
              <i className="fa-solid fa-circle-notch animate-spin text-sm mt-0.5 shrink-0" />
              <span className="font-medium">Verifying account…</span>
            </>
          ) : verifiedAccount ? (
            <>
              <i className="fa-solid fa-circle-check text-base mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Account Verified ✓</p>
                <p className="font-semibold text-[#111111] mt-0.5 uppercase tracking-wide">
                  {verifiedAccount.accountName}
                </p>
              </div>
            </>
          ) : (
            <>
              <i className="fa-solid fa-circle-exclamation text-base mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Verification Failed</p>
                <p className="text-xs mt-0.5">{verifyError}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Empty-state prompt ── */}
      {!verifying && !verifyError && !verifiedAccount && accountNumber.length > 0 && accountNumber.length < 10 && (
        <p className="text-xs text-[#9B9B9B] flex items-center gap-1.5">
          <i className="fa-solid fa-circle-info text-xs shrink-0" />
          Enter all 10 digits to auto-verify your account
        </p>
      )}
    </div>
  );
}
