"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { registerSchema } from "@/utils/validators";

interface Bank { name: string; code: string; slug: string; }

/* ── Reusable upload zone ─────────────────────────────────────────────── */
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
      <label className="block text-xs font-semibold text-[#111111] mb-1.5">
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
                  Uploading…
                </div>
              ) : uploaded ? (
                <div className="flex items-center gap-2 text-[#A4860E] text-sm font-semibold">
                  <i className="fa-solid fa-circle-check text-xs" />
                  Passport uploaded
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                  Processing…
                </div>
              )}
              <p className="text-xs text-[#9B9B9B] mt-1">Click to change</p>
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
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); }}
      />
    </div>
  );
}

/* ── Main form ────────────────────────────────────────────────────────── */
function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as "buyer" | "seller") ?? "buyer";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "", lastName: "", name: "", email: "", password: "", confirmPassword: "", phone: "",
    hearAboutUs: "", school: "", nin: "", sellerCategory: "",
    role: defaultRole, storeName: "", storeDescription: "",
    bankName: "", bankCode: "", accountNumber: "", accountName: "",
    passport: "",
  });

  /* Passport — shared for both buyer and seller */
  const [passportPreview, setPassportPreview] = useState("");
  const [passportUploading, setPassportUploading] = useState(false);

  /* Bank */
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

  /* Misc */
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
      .then((d) => { if (Array.isArray(d) && d.length > 0) setSchools(d); })
      .catch(() => {});

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCategories(d); })
      .catch(() => {});

    fetch("/api/banks")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.banks) && d.banks.length > 0) setBanks(d.banks);
        setBanksLoaded(true);
      })
      .catch(() => { setBanksLoaded(true); });
  }, []);

  /* Close bank dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bankRef.current && !bankRef.current.contains(e.target as Node))
        setShowBankDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Bank autocomplete */
  const handleBankQueryChange = (q: string) => {
    setBankQuery(q);
    setForm((f) => ({ ...f, bankName: "", bankCode: "" }));
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
    setForm((f) => ({ ...f, bankName: bank.name, bankCode: bank.code }));
    setBankSuggestions([]);
    setShowBankDropdown(false);
    setAccountVerified(false);
    setManualAccountEntry(false);
    setVerifyError("");
    setForm((f) => ({ ...f, bankName: bank.name, bankCode: bank.code, accountName: "" }));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.accountNumber, form.bankCode]);

  /* Passport upload — uses server-side Cloudinary endpoint */
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

  /* Step navigation */
  const handleNext = () => {
    setError("");
    if (step === 2) {
      if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword || !form.phone) {
        setError("Please fill out all fields."); return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match."); return;
      }
    }
    setStep((p) => p + 1);
  };
  const handleBack = () => { setError(""); setStep((p) => p - 1); };

  /* Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreedToTerms) {
      setError("You must agree to the Terms & Conditions to continue."); return;
    }
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      if (data.autoVerified) setIsAutoVerified(true);
      setIsRegistered(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Registered success screen ───────────────────────────────────────── */
  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/30 via-white to-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="border border-[#e8d48a] rounded-2xl p-10 bg-white shadow-xl">
            <div className="w-16 h-16 bg-[#fdf8e8] rounded-full flex items-center justify-center mx-auto mb-5 border border-[#e8d48a]">
              <i className={`${isAutoVerified ? "fa-solid fa-check" : "fa-solid fa-envelope"} text-[#A4860E] text-2xl`} />
            </div>
            <h2 className="text-2xl font-bold text-[#111111] mb-2">
              {isAutoVerified ? "Account Created!" : "Check your email"}
            </h2>
            <p className="text-sm text-[#6B6B6B] mb-6 leading-relaxed">
              {isAutoVerified ? (
                <>Your account <strong className="text-[#111111]">{form.email}</strong> is ready to use.</>
              ) : (
                <>We&apos;ve sent a verification code to <strong className="text-[#111111]">{form.email}</strong>.</>
              )}
            </p>
            {isAutoVerified ? (
              <Link href="/auth/login"
                className="block w-full py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-[#A4860E]/20">
                Sign In
              </Link>
            ) : (
              <Link href={`/auth/verify-email?email=${encodeURIComponent(form.email)}`}
                className="block w-full py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-[#A4860E]/20">
                Enter Verification Code
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Shared style helpers ─────────────────────────────────────────────── */
  const inputClass = "w-full pl-9 pr-4 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white";
  const inputClassBare = "w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white";
  const labelClass = "block text-xs font-semibold text-[#111111] mb-1.5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/30 via-white to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl md:max-w-3xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <img src="/main_logo.png" alt="Marketplace Logo" className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] mt-6 mb-1">Create account</h1>
          <p className="text-sm text-[#6B6B6B]">Step {step} of 3</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                step === s ? "bg-[#A4860E] text-white ring-4 ring-[#A4860E]/20" :
                step > s ? "bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]" : "bg-[#F5F5F5] text-[#9B9B9B]"
              }`}>
                {step > s ? <i className="fa-solid fa-check text-xs" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 mx-1 rounded-full transition-all ${step > s ? "bg-[#A4860E]" : "bg-[#E5E5E5]"}`} />}
            </div>
          ))}
        </div>

        <div className="border border-[#E5E5E5] rounded-2xl p-7 bg-white shadow-lg shadow-gray-100/50">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] mb-5">
              <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">

            {/* ── STEP 1: Role ── */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#111111] text-center mb-2">How will you use CampusGo?</p>
                <div className="grid grid-cols-2 gap-4">
                  {(["buyer", "seller"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setForm((f) => ({ ...f, role: r }))}
                      className={`p-5 rounded-2xl border-2 text-center transition-all ${
                        form.role === r
                          ? "border-[#A4860E] bg-[#fdf8e8] shadow-md shadow-[#A4860E]/10"
                          : "border-[#E5E5E5] hover:border-[#D0D0D0] bg-white"
                      }`}>
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl mb-3 ${
                        form.role === r ? "bg-[#A4860E] text-white shadow-md" : "bg-[#F5F5F5] text-[#9B9B9B]"
                      }`}>
                        <i className={`fa-solid ${r === "buyer" ? "fa-cart-shopping" : "fa-store"}`} />
                      </div>
                      <p className={`text-sm font-bold capitalize ${form.role === r ? "text-[#A4860E]" : "text-[#111111]"}`}>{r}</p>
                      <p className="text-xs text-[#9B9B9B] mt-1">
                        {r === "buyer" ? "Browse & buy products" : "List & sell products"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: Basic info ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name <span className="text-[#DC2626]">*</span></label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                      <input type="text" required value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value, name: `${e.target.value} ${f.lastName}`.trim() }))}
                        placeholder="John" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Last Name <span className="text-[#DC2626]">*</span></label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                      <input type="text" required value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value, name: `${f.firstName} ${e.target.value}`.trim() }))}
                        placeholder="Doe" className={inputClass} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type="email" required value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Password <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type={showPassword ? "text" : "password"} required value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      className="w-full pl-9 pr-10 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors" tabIndex={-1}>
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-check-double absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type={showConfirmPassword ? "text" : "password"} required value={form.confirmPassword}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-10 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors" tabIndex={-1}>
                      <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Mobile Phone <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type="tel" required value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d+]/g, "") }))}
                      placeholder="08012345678" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Role-specific ── */}
            {step === 3 && (
              <div className="space-y-4">

                {/* ─── BUYER fields ─── */}
                {form.role === "buyer" && (
                  <>
                    {/* School */}
                    <div>
                      <label className={labelClass}>School / Campus <span className="text-[#DC2626]">*</span></label>
                      <div className="relative">
                        <i className="fa-solid fa-graduation-cap absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                        <select required value={form.school}
                          onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                          className={`${inputClassBare} pl-9`}>
                          <option value="" disabled>Select your school / campus</option>
                          {schools.map((s) => (
                            <option key={s._id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* How did you hear */}
                    <div>
                      <label className={labelClass}>How did you hear about us? <span className="text-[#DC2626]">*</span></label>
                      <div className="relative">
                        <i className="fa-solid fa-bullhorn absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                        <select required value={form.hearAboutUs}
                          onChange={(e) => setForm((f) => ({ ...f, hearAboutUs: e.target.value }))}
                          className={`${inputClassBare} pl-9`}>
                          <option value="" disabled>Select an option</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Friend/Referral">Friend / Referral</option>
                          <option value="Google Search">Google Search</option>
                          <option value="Advertisement">Advertisement</option>
                        </select>
                      </div>
                    </div>

                    {/* No-return-policy notice */}
                    <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                      <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 shrink-0 text-sm" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        <strong>No Return Policy:</strong> All purchases on CampusGo are final. Once an order is confirmed, returns or refunds are not accepted. Please review products carefully before purchasing.
                      </p>
                    </div>
                  </>
                )}

                {/* ─── SELLER fields ─── */}
                {form.role === "seller" && (
                  <>
                    {/* School + Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>School / Campus <span className="text-[#DC2626]">*</span></label>
                        <div className="relative">
                          <i className="fa-solid fa-graduation-cap absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                          <select required value={form.school}
                            onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                            className={`${inputClassBare} pl-9`}>
                            <option value="" disabled>Select your school</option>
                            {schools.map((s) => (
                              <option key={s._id} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Primary Category <span className="text-[#DC2626]">*</span></label>
                        <select required value={form.sellerCategory}
                          onChange={(e) => setForm((f) => ({ ...f, sellerCategory: e.target.value }))}
                          className={inputClassBare}>
                          <option value="" disabled>Select category</option>
                          {categories.map((c) => (<option key={c._id} value={c.name}>{c.name}</option>))}
                          <option value="General/Other">General / Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Store Name */}
                    <div>
                      <label className={labelClass}>Store Name <span className="text-[#DC2626]">*</span></label>
                      <div className="relative">
                        <i className="fa-solid fa-store absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                        <input type="text" required value={form.storeName}
                          onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                          placeholder="My Awesome Store" className={inputClass} />
                      </div>
                    </div>

                    {/* Passport upload for sellers */}
                    <PassportUpload
                      preview={passportPreview}
                      uploading={passportUploading}
                      uploaded={!!form.passport}
                      onFileChange={handlePassportChange}
                    />

                    {/* Payout notice */}
                    <div className="flex items-start gap-3 p-3.5 bg-[#fdf8e8] border border-[#e8d48a] rounded-xl">
                      <i className="fa-solid fa-clock text-[#A4860E] mt-0.5 shrink-0 text-sm" />
                      <p className="text-xs text-[#7a6310] leading-relaxed">
                        <strong>Payout Policy:</strong> Earnings are released to your bank account <strong>24 hours after a completed &amp; confirmed order</strong>. Ensure your bank details are accurate to avoid delays.
                      </p>
                    </div>

                    {/* Bank Details */}
                    <div className="pt-3 border-t border-[#E5E5E5]">
                      <p className="text-sm font-bold text-[#111111] mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-building-columns text-[#A4860E]" />
                        Bank Details
                        <span className="font-normal text-xs text-[#9B9B9B]">— for payouts</span>
                      </p>
                      <div className="space-y-3">

                        {/* Bank name */}
                        <div ref={bankRef} className="relative">
                          <label className={labelClass}>Bank Name <span className="text-[#DC2626]">*</span></label>
                          {!banksLoaded ? (
                            <div className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-gray-50 text-sm text-[#9B9B9B] flex items-center gap-2">
                              <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                              Loading banks…
                            </div>
                          ) : banks.length > 0 ? (
                            /* Autocomplete mode */
                            <div className="relative">
                              <i className="fa-solid fa-landmark absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                              <input
                                type="text"
                                value={bankQuery}
                                onChange={(e) => handleBankQueryChange(e.target.value)}
                                onFocus={() => bankSuggestions.length > 0 && setShowBankDropdown(true)}
                                placeholder="Type to search bank…"
                                autoComplete="off"
                                className={inputClass}
                              />
                              {form.bankCode && (
                                <i className="fa-solid fa-circle-check absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A4860E] text-xs" />
                              )}
                            </div>
                          ) : (
                            /* Manual mode — no Paystack key */
                            <div className="relative">
                              <i className="fa-solid fa-landmark absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                              <input
                                type="text"
                                value={form.bankName}
                                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value, bankCode: e.target.value }))}
                                placeholder="e.g. Access Bank"
                                className={inputClass}
                              />
                            </div>
                          )}
                          {/* Dropdown */}
                          {showBankDropdown && bankSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-xl z-30 overflow-hidden max-h-52 overflow-y-auto">
                              {bankSuggestions.map((b) => (
                                <button key={b.code} type="button"
                                  onMouseDown={(e) => { e.preventDefault(); selectBank(b); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#fdf8e8] text-left transition-colors">
                                  <i className="fa-solid fa-building-columns text-[10px] text-[#A4860E]" />
                                  <span className="text-sm text-[#111111]">{b.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Account number */}
                        <div>
                          <label className={labelClass}>Account Number <span className="text-[#DC2626]">*</span></label>
                          <div className="relative">
                            <i className="fa-solid fa-hashtag absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                            <input type="text" required value={form.accountNumber}
                              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
                              placeholder="10-digit account number" maxLength={10}
                              className={`${inputClass} font-mono tracking-wider`} />
                            {verifyingAccount && (
                              <i className="fa-solid fa-circle-notch animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A4860E] text-xs" />
                            )}
                            {accountVerified && !verifyingAccount && (
                              <i className="fa-solid fa-circle-check absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A4860E] text-xs" />
                            )}
                          </div>
                          {!form.bankCode && form.accountNumber.length > 0 && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <i className="fa-solid fa-triangle-exclamation text-[10px]" />
                              Please select a bank first
                            </p>
                          )}
                        </div>

                        {/* Account name — auto or manual */}
                        <div>
                          <label className={labelClass}>
                            Account Name <span className="text-[#DC2626]">*</span>
                            {accountVerified && <span className="ml-2 text-[#A4860E] font-normal">✓ Verified</span>}
                            {manualAccountEntry && <span className="ml-2 text-amber-600 font-normal text-xs">— enter manually</span>}
                          </label>

                          {verifyingAccount ? (
                            <div className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-gray-50 text-sm text-[#9B9B9B] flex items-center gap-2">
                              <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                              Verifying account…
                            </div>
                          ) : accountVerified ? (
                            <div className="w-full px-4 py-3 rounded-xl border border-[#A4860E] bg-[#fdf8e8] text-sm text-[#A4860E] font-semibold flex items-center justify-between">
                              <span>{form.accountName}</span>
                              <i className="fa-solid fa-circle-check text-xs" />
                            </div>
                          ) : manualAccountEntry ? (
                            <>
                              <div className="relative">
                                <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                                <input
                                  type="text"
                                  value={form.accountName}
                                  onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value.toUpperCase() }))}
                                  placeholder="e.g. JOHN DOE"
                                  className={`${inputClass} font-mono tracking-wider`}
                                />
                              </div>
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1.5">
                                <i className="fa-solid fa-triangle-exclamation text-[10px]" />
                                Live verification unavailable. Enter your account name exactly as on your bank statement.
                              </p>
                            </>
                          ) : (
                            <div className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-gray-50 text-sm text-[#9B9B9B]">
                              Will auto-fill after verification
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
                  </>
                )}

                {/* ── Terms & Conditions ── */}
                <div className="pt-3 border-t border-[#E5E5E5]">
                  <div className="p-4 bg-gray-50 rounded-xl border border-[#E5E5E5] text-xs text-[#6B6B6B] leading-relaxed max-h-36 overflow-y-auto mb-3">
                    <p className="font-semibold text-[#111111] mb-2">Terms &amp; Conditions Summary</p>
                    <p className="mb-2">By creating a CampusGo account, you agree to the following:</p>
                    <ul className="space-y-1.5 list-disc list-inside">
                      <li>You must be a registered student or staff of an affiliated institution.</li>
                      <li>All information provided must be accurate and truthful.</li>
                      <li>CampusGo is not liable for disputes between buyers and sellers.</li>
                      {form.role === "buyer" && (
                        <li><strong className="text-[#111111]">No Return Policy:</strong> All purchases are final. No refunds or returns are accepted once an order is confirmed.</li>
                      )}
                      {form.role === "seller" && (
                        <>
                          <li><strong className="text-[#111111]">Payout Policy:</strong> Earnings are disbursed 24 hours after a completed and confirmed order.</li>
                          <li>Sellers are responsible for the quality and accurate description of listed products.</li>
                          <li>CampusGo reserves the right to suspend accounts engaged in fraudulent activity.</li>
                        </>
                      )}
                      <li>Your data is handled in accordance with our Privacy Policy.</li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-[#E0E0E0] flex items-center gap-3">
                      <Link href="/terms" target="_blank" className="text-[#A4860E] hover:underline font-semibold">Full Terms &amp; Conditions ↗</Link>
                      <span className="text-[#D0D0D0]">·</span>
                      <Link href="/privacy" target="_blank" className="text-[#A4860E] hover:underline font-semibold">Privacy Policy ↗</Link>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        agreedToTerms
                          ? "bg-[#A4860E] border-[#A4860E]"
                          : "border-[#D0D0D0] group-hover:border-[#A4860E]"
                      }`}>
                        {agreedToTerms && <i className="fa-solid fa-check text-white text-[10px]" />}
                      </div>
                    </div>
                    <span className="text-xs text-[#6B6B6B] leading-relaxed">
                      I have read and agree to CampusGo&apos;s{" "}
                      <Link href="/terms" target="_blank" className="text-[#A4860E] font-semibold hover:underline">Terms &amp; Conditions</Link>
                      {" "}and{" "}
                      <Link href="/privacy" target="_blank" className="text-[#A4860E] font-semibold hover:underline">Privacy Policy</Link>
                      {form.role === "buyer" && <>, including the <strong className="text-[#111111]">no return policy</strong></>}
                      {form.role === "seller" && <>, including the <strong className="text-[#111111]">24-hour payout policy</strong></>}
                      .
                    </span>
                  </label>
                </div>

              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#E5E5E5] mt-4">
              {step > 1 && (
                <button type="button" onClick={handleBack} disabled={loading}
                  className="px-5 py-3 bg-white text-[#111111] font-semibold rounded-xl border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors text-sm">
                  ← Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading || (step === 3 && passportUploading)}
                className="py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl transition-all text-sm flex-1 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#A4860E]/20"
              >
                {step < 3 ? "Continue →" : loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                    Creating account…
                  </span>
                ) : "Create Account"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B6B6B] mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#A4860E] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#A4860E] rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
