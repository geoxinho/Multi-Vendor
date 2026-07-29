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
            <svg className="w-4 h-4 animate-spin text-[#2563EB]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input
                id="bank-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={handleSearchChange}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Search and select your bank…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] bg-white text-sm transition-colors"
              />
              {bankCode && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#16A34A]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
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
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#EFF6FF] transition-colors ${
                        bank.code === bankCode
                          ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
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
          className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] bg-white text-sm font-mono tracking-widest transition-colors"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-[#9B9B9B]">Digits only, exactly 10 characters</p>
          <p className={`text-xs font-mono ${accountNumber.length === 10 ? "text-[#16A34A]" : "text-[#9B9B9B]"}`}>
            {accountNumber.length}/10
          </p>
        </div>
      </div>

      {/* ── Verification Status ── */}
      {(verifying || verifyError || verifiedAccount) && (
        <div
          className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm ${
            verifying
              ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]"
              : verifiedAccount
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {verifying ? (
            <>
              <svg className="w-4 h-4 mt-0.5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="font-medium">Verifying account…</span>
            </>
          ) : verifiedAccount ? (
            <>
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-bold">Account Verified ✓</p>
                <p className="font-semibold text-[#111111] mt-0.5 uppercase tracking-wide">
                  {verifiedAccount.accountName}
                </p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Enter all 10 digits to auto-verify your account
        </p>
      )}
    </div>
  );
}
