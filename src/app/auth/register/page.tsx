"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { registerSchema } from "@/utils/validators";

interface Bank {
  name: string;
  code: string;
  slug: string;
}

/* ── Reusable Passport Upload Component ───────────────────────────────── */
function PassportUpload({
  preview,
  uploading,
  uploaded,
  onFileChange,
}: {
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  onFileChange: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-semibold text-[#111111] mb-1.5 uppercase tracking-wider">
        Passport Photograph <span className="text-[#DC2626]">*</span>
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4 ${
          preview
            ? "border-[#A4860E] bg-[#fdf8e8]/50"
            : "border-[#E5E5E5] hover:border-[#A4860E]/50 hover:bg-[#fdf8e8]/30"
        }`}
      >
        {preview ? (
          <>
            <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#e8d48a] shrink-0">
              <Image src={preview} alt="Passport preview" fill className="object-cover" />
            </div>
            <div>
              {uploading ? (
                <div className="flex items-center gap-2 text-[#A4860E] text-sm font-medium">
                  <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                  Uploading to Cloudinary…
                </div>
              ) : uploaded ? (
                <div className="flex items-center gap-2 text-[#A4860E] text-sm font-semibold">
                  <i className="fa-solid fa-circle-check text-xs" />
                  Passport photo uploaded
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                  Processing…
                </div>
              )}
              <p className="text-xs text-[#9B9B9B] mt-1">Click to change photo</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 rounded-xl bg-[#fdf8e8] flex items-center justify-center border border-[#e8d48a] shrink-0">
              <i className="fa-solid fa-camera text-[#A4860E] text-lg" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#111111]">Upload passport photo</p>
              <p className="text-xs text-[#9B9B9B] mt-0.5">JPG, PNG · Clear face · Max 5MB</p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChange(f);
        }}
      />
    </div>
  );
}

/* ── Main Registration Form ─────────────────────────────────────────── */
function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as "buyer" | "seller") ?? "buyer";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    hearAboutUs: "",
    school: "",
    nin: "",
    sellerCategory: "",
    role: defaultRole,
    storeName: "",
    storeDescription: "",
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    passport: "",
  });

  /* Passport */
  const [passportPreview, setPassportPreview] = useState("");
  const [passportUploading, setPassportUploading] = useState(false);

  /* Bank state */
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

  /* Categories & Schools */
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [schools, setSchools] = useState<{ _id: string; name: string; code?: string }[]>([
    { _id: "1", name: "Adeleke University" },
    { _id: "2", name: "Federal Polytechnic Ede" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAutoVerified, setIsAutoVerified] = useState(false);

  /* Load categories, schools & banks */
  useEffect(() => {
    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) setSchools(d);
      })
      .catch(() => {});

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCategories(d);
      })
      .catch(() => {});

    fetch("/api/banks")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.banks) && d.banks.length > 0) setBanks(d.banks);
        setBanksLoaded(true);
      })
      .catch(() => {
        setBanksLoaded(true);
      });
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

  /* Bank query search */
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

  /* Auto-verify account */
  useEffect(() => {
    if (form.role === "seller" && form.accountNumber.length === 10 && form.bankCode) {
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
        .catch(() => {
          setManualAccountEntry(true);
        })
        .finally(() => setVerifyingAccount(false));
    } else if (form.accountNumber.length < 10) {
      setAccountVerified(false);
      setManualAccountEntry(false);
      setVerifyError("");
      setForm((f) => ({ ...f, accountName: "" }));
    }
  }, [form.accountNumber, form.bankCode, form.role]);

  /* Passport upload */
  const handlePassportChange = async (file: File) => {
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
        setError(json.error ?? "Passport upload failed. Please try again.");
        setPassportPreview("");
      }
    } catch {
      setError("Passport upload failed. Please check your connection and try again.");
      setPassportPreview("");
    } finally {
      setPassportUploading(false);
    }
  };

  /* Navigation between steps */
  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!form.role) {
        setError("Please choose whether you want to buy or sell on the platform.");
        return;
      }
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError("Please enter your first and last name.");
        return;
      }
      if (!form.email.trim()) {
        setError("Please enter your email address.");
        return;
      }
      if (!form.password || form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!form.phone || form.phone.length < 10) {
        setError("Please enter a valid mobile phone number.");
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    setError("");
    setStep(1);
  };

  /* Submit handler */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("You must agree to the Terms & Conditions to continue.");
      return;
    }

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      if (data.autoVerified) setIsAutoVerified(true);
      setIsRegistered(true);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Registration Success Screen */
  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/30 via-white to-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="border border-[#e8d48a] rounded-2xl p-10 bg-white shadow-xl">
            <div className="w-16 h-16 bg-[#fdf8e8] rounded-full flex items-center justify-center mx-auto mb-5 border border-[#e8d48a]">
              <i className={`${isAutoVerified ? "fa-solid fa-check" : "fa-solid fa-envelope"} text-[#A4860E] text-2xl`} />
            </div>
            <h2 className="text-2xl font-bold text-[#111111] mb-2">
              {isAutoVerified ? "Registration Complete!" : "Verify your email"}
            </h2>
            <p className="text-sm text-[#6B6B6B] mb-6 leading-relaxed">
              {isAutoVerified
                ? `Welcome to CampusGo, ${form.firstName}! Your ${form.role === "seller" ? "seller store" : "buyer account"} is ready.`
                : `We sent a 6-digit verification code to ${form.email}. Please verify your email to log in.`}
            </p>
            <div className="space-y-3">
              <Link
                href={isAutoVerified ? "/auth/login" : `/auth/verify-email?email=${encodeURIComponent(form.email)}`}
                className="block w-full py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-[#A4860E]/20"
              >
                {isAutoVerified ? "Go to Sign In" : "Enter Verification Code"}
              </Link>
              <Link href="/" className="block text-xs text-[#9B9B9B] hover:text-[#111111] transition-colors">
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const labelClass = "block text-xs font-semibold text-[#111111] mb-1.5 uppercase tracking-wider";
  const inputClass = "w-full pl-9 pr-4 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white";
  const inputClassBare = "w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/30 via-white to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl md:max-w-3xl">

        {/* Logo & Heading */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <img
              src="/main_logo.png"
              alt="Marketplace Logo"
              className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] mt-6 mb-1">
            Create an Account
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            {step === 1 ? "Step 1 of 2: Account Type & Personal Information" : `Step 2 of 2: ${form.role === "buyer" ? "Buyer Eligibility Requirements" : "Seller Store & Payout Setup"}`}
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  step === s
                    ? "bg-[#A4860E] text-white ring-4 ring-[#A4860E]/20"
                    : step > s
                      ? "bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]"
                      : "bg-[#F5F5F5] text-[#9B9B9B]"
                }`}
              >
                {step > s ? <i className="fa-solid fa-check text-xs" /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-16 h-0.5 mx-2 rounded-full transition-all ${
                    step > s ? "bg-[#A4860E]" : "bg-[#E5E5E5]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 bg-white shadow-xl shadow-gray-100/50">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] mb-5">
              <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
            className="space-y-5"
          >
            {/* ── STEP 1: Account Type Dropdown + Basic Info ── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* ── The Primary Purpose Dropdown ── */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#fdf8e8]/60 border border-[#e8d48a]">
                  <label className="block text-xs font-bold text-[#111111] mb-2 uppercase tracking-wider">
                    I want to <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <i
                      className={`fa-solid ${
                        form.role === "buyer" ? "fa-cart-shopping" : "fa-store"
                      } absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4860E] text-sm`}
                    />
                    <select
                      value={form.role}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, role: e.target.value as "buyer" | "seller" }));
                        setError("");
                      }}
                      className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-[#A4860E] bg-white text-sm font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#A4860E]/20 transition-all cursor-pointer shadow-xs"
                    >
                      <option value="buyer">To buy on the Platform (Buyer)</option>
                      <option value="seller">To sell on the Platform (Seller)</option>
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-gray-600 mt-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-truck text-[#A4860E]" />
                    <span>
                      <strong>Notice:</strong> Delivery is handled directly by the seller on campus.
                    </span>
                  </p>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className={labelClass}>
                      First Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            firstName: e.target.value,
                            name: `${e.target.value} ${f.lastName}`.trim(),
                          }))
                        }
                        placeholder="John"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Last Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                      <input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            lastName: e.target.value,
                            name: `${f.firstName} ${e.target.value}`.trim(),
                          }))
                        }
                        placeholder="Doe"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Email Address <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@student.edu.ng"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      Password <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Min. 6 characters"
                        className="w-full pl-9 pr-10 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
                        tabIndex={-1}
                      >
                        <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Confirm Password <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-check-double absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={form.confirmPassword}
                        onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                        placeholder="Repeat password"
                        className="w-full pl-9 pr-10 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
                        tabIndex={-1}
                      >
                        <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Mobile Phone <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d+]/g, "") }))
                      }
                      placeholder="08012345678"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-extrabold rounded-xl transition-all text-sm shadow-md shadow-[#A4860E]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to {form.role === "buyer" ? "Buyer Requirements" : "Seller Setup"}</span>
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Role-Specific Requirements (Controlled by Dropdown) ── */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Compact purpose selector banner */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-500 font-medium">Selected Account Type:</span>
                    <span className="text-xs font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs capitalize flex items-center gap-1.5">
                      <i className={`fa-solid ${form.role === "buyer" ? "fa-cart-shopping text-[#A4860E]" : "fa-store text-[#A4860E]"}`} />
                      {form.role === "buyer" ? "To buy on the Platform (Buyer)" : "To sell on the Platform (Seller)"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, role: f.role === "buyer" ? "seller" : "buyer" }));
                      setError("");
                    }}
                    className="text-xs text-[#A4860E] font-bold hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>

                {/* ══════════ OPTION 1: BUYER REQUIREMENTS ══════════ */}
                {form.role === "buyer" && (
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-2">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <i className="fa-solid fa-graduation-cap text-[#A4860E]" />
                        Buyer Eligibility &amp; Campus Verification
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        CampusGo connects you with sellers in your school with verified escrow delivery.
                      </p>
                    </div>

                    {/* School / Campus */}
                    <div>
                      <label className={labelClass}>
                        School / Campus <span className="text-[#DC2626]">*</span>
                      </label>
                      <div className="relative">
                        <i className="fa-solid fa-building-columns absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                        <select
                          required
                          value={form.school}
                          onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                          className={`${inputClassBare} pl-9`}
                        >
                          <option value="" disabled>Select your school / campus</option>
                          {schools.map((s) => (
                            <option key={s._id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* How did you hear about us */}
                    <div>
                      <label className={labelClass}>
                        How did you hear about us? <span className="text-[#DC2626]">*</span>
                      </label>
                      <div className="relative">
                        <i className="fa-solid fa-bullhorn absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                        <select
                          required
                          value={form.hearAboutUs}
                          onChange={(e) => setForm((f) => ({ ...f, hearAboutUs: e.target.value }))}
                          className={`${inputClassBare} pl-9`}
                        >
                          <option value="" disabled>Select an option</option>
                          <option value="Campus Banner/Flyer">Campus Banner / Flyer</option>
                          <option value="Social Media (WhatsApp/Instagram/TikTok)">Social Media (WhatsApp / Instagram / TikTok)</option>
                          <option value="Friend/Student Referral">Friend / Fellow Student Referral</option>
                          <option value="Student Union/Association">Student Union / Association</option>
                          <option value="Google Search">Google Search</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Delivery notice for Buyer */}
                    <div className="p-4 bg-amber-50/70 border border-[#e8d48a] rounded-2xl flex items-start gap-3">
                      <i className="fa-solid fa-truck text-[#A4860E] text-base mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Delivery is Handled by the Seller</h4>
                        <p className="text-[11px] text-[#7a6310] mt-1 leading-relaxed">
                          All orders on CampusGo are delivered directly by the seller. The seller will reach out to arrange a convenient campus meetup or delivery to your hostel. Only release your 6-digit confirmation PIN after inspecting and accepting your product.
                        </p>
                      </div>
                    </div>

                    {/* Buyer Escrow & Safety Policy Box */}
                    <div className="p-4 bg-[#fdf8e8]/80 border border-[#e8d48a] rounded-2xl flex items-start gap-3">
                      <i className="fa-solid fa-shield-halved text-[#A4860E] text-base mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Buyer Protection &amp; Escrow Guarantee</h4>
                        <p className="text-[11px] text-[#7a6310] mt-1 leading-relaxed">
                          Your money is safely held in escrow until you meet the seller, inspect the product, and give them your 6-digit confirmation PIN.
                        </p>
                      </div>
                    </div>

                    {/* Final sale notice */}
                    <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-2.5">
                      <i className="fa-solid fa-circle-exclamation text-gray-500 text-xs mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <strong>No Return Policy:</strong> Once you verify the item and hand over your delivery PIN to the seller, the order is finalized and cannot be returned. Always inspect products thoroughly before sharing your PIN.
                      </p>
                    </div>
                  </div>
                )}

                {/* ══════════ OPTION 2: SELLER REQUIREMENTS ══════════ */}
                {form.role === "seller" && (
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-2">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <i className="fa-solid fa-store text-[#A4860E]" />
                        Seller Store &amp; Payout Setup
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Provide your campus store details and bank account to receive 24-hr payouts.
                      </p>
                    </div>

                    {/* School + Primary Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>
                          Campus / School <span className="text-[#DC2626]">*</span>
                        </label>
                        <div className="relative">
                          <i className="fa-solid fa-graduation-cap absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                          <select
                            required
                            value={form.school}
                            onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                            className={`${inputClassBare} pl-9`}
                          >
                            <option value="" disabled>Select your campus</option>
                            {schools.map((s) => (
                              <option key={s._id} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>
                          Primary Category <span className="text-[#DC2626]">*</span>
                        </label>
                        <select
                          required
                          value={form.sellerCategory}
                          onChange={(e) => setForm((f) => ({ ...f, sellerCategory: e.target.value }))}
                          className={inputClassBare}
                        >
                          <option value="" disabled>Select product category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="General/Other">General / Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Store Name */}
                    <div>
                      <label className={labelClass}>
                        Store Name <span className="text-[#DC2626]">*</span>
                      </label>
                      <div className="relative">
                        <i className="fa-solid fa-store absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                        <input
                          type="text"
                          required
                          value={form.storeName}
                          onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                          placeholder="e.g. Samuel's Campus Electronics"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Passport Photograph */}
                    <PassportUpload
                      preview={passportPreview}
                      uploading={passportUploading}
                      uploaded={!!form.passport}
                      onFileChange={handlePassportChange}
                    />

                    {/* Payout Escrow Notice */}
                    <div className="p-3.5 bg-[#fdf8e8] border border-[#e8d48a] rounded-xl flex items-start gap-2.5">
                      <i className="fa-solid fa-clock text-[#A4860E] text-xs mt-0.5 shrink-0" />
                      <p className="text-xs text-[#7a6310] leading-relaxed">
                        <strong>Payout Policy:</strong> Sales earnings are disbursed directly to your bank account <strong>24 hours after order delivery &amp; PIN confirmation</strong>. Ensure bank details are exact.
                      </p>
                    </div>

                    {/* Bank Details Section */}
                    <div className="pt-3 border-t border-[#E5E5E5] space-y-3">
                      <p className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-building-columns text-[#A4860E]" />
                        Bank Details for Payouts
                      </p>

                      {/* Bank Search */}
                      <div ref={bankRef} className="relative">
                        <label className={labelClass}>
                          Bank Name <span className="text-[#DC2626]">*</span>
                        </label>
                        {!banksLoaded ? (
                          <div className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-gray-50 text-sm text-[#9B9B9B] flex items-center gap-2">
                            <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                            Loading banks…
                          </div>
                        ) : banks.length > 0 ? (
                          <div className="relative">
                            <i className="fa-solid fa-landmark absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
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
                            <i className="fa-solid fa-landmark absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                            <input
                              type="text"
                              value={form.bankName}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, bankName: e.target.value, bankCode: e.target.value }))
                              }
                              placeholder="e.g. Access Bank"
                              className={inputClass}
                            />
                          </div>
                        )}

                        {/* Suggestions Dropdown */}
                        {showBankDropdown && bankSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-xl z-30 overflow-hidden max-h-52 overflow-y-auto">
                            {bankSuggestions.map((b) => (
                              <button
                                key={b.code}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectBank(b);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#fdf8e8] text-left transition-colors"
                              >
                                <i className="fa-solid fa-building-columns text-[10px] text-[#A4860E]" />
                                <span className="text-sm text-[#111111]">{b.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className={labelClass}>
                          Account Number <span className="text-[#DC2626]">*</span>
                        </label>
                        <div className="relative">
                          <i className="fa-solid fa-hashtag absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                          <input
                            type="text"
                            required
                            value={form.accountNumber}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))
                            }
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

                      {/* Account Name */}
                      <div>
                        <label className={labelClass}>
                          Account Name <span className="text-[#DC2626]">*</span>
                          {accountVerified && (
                            <span className="ml-2 text-[#A4860E] font-normal normal-case">✓ Verified</span>
                          )}
                        </label>
                        {verifyingAccount ? (
                          <div className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-gray-50 text-sm text-[#9B9B9B] flex items-center gap-2">
                            <i className="fa-solid fa-circle-notch animate-spin text-xs text-[#A4860E]" />
                            Verifying account name with bank…
                          </div>
                        ) : accountVerified ? (
                          <div className="w-full px-4 py-3 rounded-xl border border-[#A4860E] bg-[#fdf8e8] text-sm text-[#A4860E] font-bold flex items-center justify-between">
                            <span>{form.accountName}</span>
                            <i className="fa-solid fa-circle-check text-xs" />
                          </div>
                        ) : manualAccountEntry ? (
                          <div className="relative">
                            <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                            <input
                              type="text"
                              value={form.accountName}
                              onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value.toUpperCase() }))}
                              placeholder="e.g. JOHN DOE"
                              className={`${inputClass} font-mono uppercase`}
                            />
                          </div>
                        ) : (
                          <div className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-gray-50 text-sm text-[#9B9B9B]">
                            Will auto-verify once 10-digit number is entered
                          </div>
                        )}
                        {verifyError && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <i className="fa-solid fa-circle-xmark text-[10px]" />
                            {verifyError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Terms & Conditions ── */}
                <div className="pt-3 border-t border-[#E5E5E5]">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#A4860E] focus:ring-[#A4860E] border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-[#6B6B6B]">
                      I have read and agree to the CampusGo{" "}
                      <Link href="/terms" target="_blank" className="text-[#A4860E] hover:underline font-semibold">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" target="_blank" className="text-[#A4860E] hover:underline font-semibold">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                </div>

                {/* Step 2 Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3.5 border border-[#E5E5E5] text-gray-700 font-bold rounded-xl transition-all text-sm hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left text-xs" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading || passportUploading || verifyingAccount}
                    className="flex-2 py-3.5 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-extrabold rounded-xl transition-all text-sm shadow-md shadow-[#A4860E]/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                        <span>Creating Account…</span>
                      </>
                    ) : (
                      <span>{form.role === "buyer" ? "Create Buyer Account" : "Register Store & Start Selling"}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-xs text-[#9B9B9B] mt-5">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#A4860E] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#A4860E] rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
