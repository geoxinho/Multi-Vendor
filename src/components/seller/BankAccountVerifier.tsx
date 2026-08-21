"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Bank {
  name: string;
  code: string;
  slug: string;
}

export interface VerifiedAccount {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  isManual?: boolean;
}

interface BankAccountVerifierProps {
  onVerified: (details: VerifiedAccount | null) => void;
  initialBankCode?: string;
  initialBankName?: string;
  initialAccountNumber?: string;
  initialAccountName?: string;
}

export default function BankAccountVerifier({
  onVerified,
  initialBankCode = "",
  initialBankName = "",
  initialAccountNumber = "",
  initialAccountName = "",
}: BankAccountVerifierProps) {
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
  const [allowManual, setAllowManual] = useState(false);
  const [manualAccountName, setManualAccountName] = useState(initialAccountName);
  const [isManualMode, setIsManualMode] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(
    initialAccountName && initialAccountNumber && initialBankCode
      ? {
          accountName: initialAccountName,
          accountNumber: initialAccountNumber,
          bankCode: initialBankCode,
          bankName: initialBankName,
        }
      : null
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load bank list once
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/banks");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load banks");
        setBanks(json.banks || []);
      } catch (e: unknown) {
        setBanksError(e instanceof Error ? e.message : "Failed to load banks");
      } finally {
        setBanksLoading(false);
      }
    };
    load();
  }, []);

  // Sync initial verified status if provided
  useEffect(() => {
    if (initialAccountName && initialAccountNumber && initialBankCode && !verifiedAccount) {
      const initial: VerifiedAccount = {
        accountName: initialAccountName,
        accountNumber: initialAccountNumber,
        bankCode: initialBankCode,
        bankName: initialBankName,
      };
      setVerifiedAccount(initial);
      onVerified(initial);
    }
  }, [initialAccountName, initialAccountNumber, initialBankCode, initialBankName, onVerified, verifiedAccount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Trigger Paystack verification
  const verify = useCallback(
    async (acctNum: string, bCode: string, bName: string) => {
      if (acctNum.length !== 10 || !bCode) return;

      setVerifying(true);
      setVerifyError("");
      setAllowManual(false);
      setVerifiedAccount(null);
      onVerified(null);

      try {
        const res = await fetch("/api/verify-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountNumber: acctNum, bankCode: bCode }),
        });
        const json = await res.json();

        if (json.manual) {
          setIsManualMode(true);
          setVerifyError(json.message || "Manual account name entry required.");
          return;
        }

        if (!res.ok) {
          setVerifyError(json.error || "Verification failed.");
          setAllowManual(!!json.allowManual);
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
        setVerifyError("Network error. Click below to enter your account name manually.");
        setAllowManual(true);
      } finally {
        setVerifying(false);
      }
    },
    [onVerified]
  );

  const scheduleVerify = useCallback(
    (acctNum: string, bCode: string, bName: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setVerifiedAccount(null);
      setVerifyError("");
      onVerified(null);
      if (acctNum.length === 10 && bCode) {
        debounceRef.current = setTimeout(() => verify(acctNum, bCode, bName), 600);
      }
    },
    [verify, onVerified]
  );

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(val);
    if (isManualMode && manualAccountName.trim().length >= 3 && val.length === 10 && bankCode) {
      const verified: VerifiedAccount = {
        accountName: manualAccountName.trim().toUpperCase(),
        accountNumber: val,
        bankCode,
        bankName,
        isManual: true,
      };
      setVerifiedAccount(verified);
      onVerified(verified);
    } else {
      scheduleVerify(val, bankCode, bankName);
    }
  };

  const handleBankSelect = (bank: Bank) => {
    setBankCode(bank.code);
    setBankName(bank.name);
    setSearch(bank.name);
    setDropdownOpen(false);
    if (isManualMode && manualAccountName.trim().length >= 3 && accountNumber.length === 10) {
      const verified: VerifiedAccount = {
        accountName: manualAccountName.trim().toUpperCase(),
        accountNumber,
        bankCode: bank.code,
        bankName: bank.name,
        isManual: true,
      };
      setVerifiedAccount(verified);
      onVerified(verified);
    } else {
      scheduleVerify(accountNumber, bank.code, bank.name);
    }
  };

  const handleManualNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualAccountName(val);
    if (val.trim().length >= 3 && accountNumber.length === 10 && bankCode) {
      const verified: VerifiedAccount = {
        accountName: val.trim().toUpperCase(),
        accountNumber,
        bankCode,
        bankName,
        isManual: true,
      };
      setVerifiedAccount(verified);
      onVerified(verified);
    } else {
      setVerifiedAccount(null);
      onVerified(null);
    }
  };

  const enableManualMode = () => {
    setIsManualMode(true);
    setVerifyError("");
    if (manualAccountName.trim().length >= 3 && accountNumber.length === 10 && bankCode) {
      const verified: VerifiedAccount = {
        accountName: manualAccountName.trim().toUpperCase(),
        accountNumber,
        bankCode,
        bankName,
        isManual: true,
      };
      setVerifiedAccount(verified);
      onVerified(verified);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Bank Selector ── */}
      <div>
        <label htmlFor="bank-search" className="block text-sm font-semibold text-[#111111] mb-1.5">
          Bank Name <span className="text-red-500">*</span>
        </label>

        {banksLoading ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA]">
            <i className="fa-solid fa-circle-notch animate-spin text-[#A4860E] text-sm shrink-0" />
            <span className="text-sm text-[#9B9B9B]">Loading banks…</span>
          </div>
        ) : banksError ? (
          <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
            {banksError}
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (bankCode && e.target.value !== bankName) {
                    setBankCode("");
                    setBankName("");
                    setVerifiedAccount(null);
                    setVerifyError("");
                    onVerified(null);
                  }
                  setDropdownOpen(true);
                }}
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
                        bank.code === bankCode ? "bg-[#fdf8e8] text-[#A4860E] font-semibold" : "text-[#111111]"
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
        <label htmlFor="account-number" className="block text-sm font-semibold text-[#111111] mb-1.5">
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

      {/* ── Manual Account Name Entry Mode ── */}
      {isManualMode && (
        <div>
          <label htmlFor="manual-name" className="block text-sm font-semibold text-[#111111] mb-1.5">
            Account Holder Name <span className="text-red-500">*</span>
          </label>
          <input
            id="manual-name"
            type="text"
            value={manualAccountName}
            onChange={handleManualNameChange}
            placeholder="e.g. JOHN OLAREWAJU"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#A4860E]/40 focus:border-[#A4860E] bg-white text-sm font-medium uppercase tracking-wide transition-colors"
          />
          <p className="text-xs text-[#9B9B9B] mt-1">
            Enter the exact full name registered on your bank account.
          </p>
        </div>
      )}

      {/* ── Verification Status Banner ── */}
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
              <span className="font-medium">Verifying account with Paystack…</span>
            </>
          ) : verifiedAccount ? (
            <>
              <i className="fa-solid fa-circle-check text-base mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold">
                  {verifiedAccount.isManual ? "Account Details Set ✓" : "Account Verified ✓"}
                </p>
                <p className="font-semibold text-[#111111] mt-0.5 uppercase tracking-wide truncate">
                  {verifiedAccount.accountName}
                </p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  {verifiedAccount.bankName} · {verifiedAccount.accountNumber}
                </p>
              </div>
            </>
          ) : (
            <>
              <i className="fa-solid fa-circle-exclamation text-base mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Verification Notice</p>
                <p className="text-xs mt-0.5">{verifyError}</p>
                {(!isManualMode || allowManual) && (
                  <button
                    type="button"
                    onClick={enableManualMode}
                    className="mt-2 text-xs font-bold underline hover:opacity-80 transition-opacity"
                  >
                    Click here to enter your account name manually →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
