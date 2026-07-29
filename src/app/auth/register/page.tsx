"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@/utils/validators";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as "buyer" | "seller") ?? "buyer";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", phone: "",
    hearAboutUs: "", school: "", nin: "", sellerCategory: "",
    role: defaultRole, storeName: "", storeDescription: "",
    bankName: "", accountNumber: "", accountName: "",
  });
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAutoVerified, setIsAutoVerified] = useState(false);
  const [devToken, setDevToken] = useState("");

  const handleNext = () => {
    setError("");
    if (step === 2) {
      if (!form.name || !form.email || !form.password || !form.confirmPassword || !form.phone) {
        setError("Please fill out all fields.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => { setError(""); setStep((prev) => prev - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      if (data.devToken) setDevToken(data.devToken);
      if (data.autoVerified) setIsAutoVerified(true);
      setIsRegistered(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="border border-[#E5E5E5] rounded-lg p-8">
            <div className="w-14 h-14 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-5">
              <i className={`${isAutoVerified ? "fa-solid fa-check" : "fa-solid fa-envelope"} text-[#16A34A] text-xl`} />
            </div>
            <h2 className="text-xl font-bold text-[#111111] mb-2">
              {isAutoVerified ? "Account Created!" : "Check your email"}
            </h2>
            <p className="text-sm text-[#6B6B6B] mb-6 leading-relaxed">
              {isAutoVerified ? (
                <>Your account <strong className="text-[#111111]">{form.email}</strong> is ready to use.</>
              ) : (
                <>We&apos;ve sent a link to <strong className="text-[#111111]">{form.email}</strong>. Please verify to activate your account.</>
              )}
            </p>

            {isAutoVerified ? (
              <Link href="/auth/login"
                className="block w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-md transition-colors text-sm">
                Sign In
              </Link>
            ) : (
              <Link href={`/auth/verify-email?email=${encodeURIComponent(form.email)}`}
                className="block w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-md transition-colors text-sm">
                Enter Verification Code
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full pl-9 pr-4 py-2.5 rounded-md border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#2563EB] transition-colors bg-white";
  const inputClassBare = "w-full px-4 py-2.5 rounded-md border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#2563EB] transition-colors bg-white";
  const labelClass = "block text-xs font-medium text-[#111111] mb-1.5";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <span className="font-bold text-xl text-[#111111]">
              Market<span className="text-[#2563EB]">Hub</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[#111111] mt-6 mb-1">Create account</h1>
          <p className="text-sm text-[#6B6B6B]">Step {step} of 3</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? "bg-[#2563EB] text-white" :
                step > s ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F5F5F5] text-[#9B9B9B]"
              }`}>
                {step > s ? <i className="fa-solid fa-check text-[10px]" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-px mx-1 ${step > s ? "bg-[#2563EB]" : "bg-[#E5E5E5]"}`} />}
            </div>
          ))}
        </div>

        <div className="border border-[#E5E5E5] rounded-lg p-6">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-md text-xs text-[#DC2626] mb-4">
              <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">

            {/* Step 1: Role */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#111111] text-center">How will you use MarketHub?</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["buyer", "seller"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setForm((f) => ({ ...f, role: r }))}
                      className={`p-4 rounded-md border-2 text-center transition-all ${
                        form.role === r
                          ? "border-[#2563EB] bg-[#EFF6FF]"
                          : "border-[#E5E5E5] hover:border-[#D0D0D0] bg-white"
                      }`}>
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg mb-2 ${
                        form.role === r ? "bg-[#2563EB] text-white" : "bg-[#F5F5F5] text-[#9B9B9B]"
                      }`}>
                        <i className={`fa-solid ${r === "buyer" ? "fa-cart-shopping" : "fa-store"}`} />
                      </div>
                      <p className={`text-sm font-semibold capitalize ${form.role === r ? "text-[#2563EB]" : "text-[#111111]"}`}>{r}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Basic info */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type="text" required value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type="email" required value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Password <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type={showPassword ? "text" : "password"} required value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 rounded-md border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#2563EB] transition-colors bg-white" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] text-xs" tabIndex={-1}>
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-check-double absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type={showConfirmPassword ? "text" : "password"} required value={form.confirmPassword}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-md border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#2563EB] transition-colors bg-white" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] text-xs" tabIndex={-1}>
                      <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Mobile Phone <span className="text-[#DC2626]">*</span></label>
                  <div className="relative">
                    <i className="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                    <input type="tel" required value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d+]/g, "") }))}
                      placeholder="08012345678" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Role-specific */}
            {step === 3 && (
              <div className="space-y-4">
                {form.role === "buyer" ? (
                  <>
                    <div>
                      <label className={labelClass}>School <span className="text-[#DC2626]">*</span></label>
                      <select required value={form.school}
                        onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                        className={inputClassBare}>
                        <option value="" disabled>Select your school</option>
                        <option value="Adeleke University">Adeleke University</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>How did you hear about us? <span className="text-[#DC2626]">*</span></label>
                      <select required value={form.hearAboutUs}
                        onChange={(e) => setForm((f) => ({ ...f, hearAboutUs: e.target.value }))}
                        className={inputClassBare}>
                        <option value="" disabled>Select an option</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Friend/Referral">Friend / Referral</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Advertisement">Advertisement</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>NIN <span className="text-[#DC2626]">*</span></label>
                        <input type="text" required value={form.nin}
                          onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "") }))}
                          placeholder="11-digit NIN" maxLength={11} className={inputClassBare} />
                      </div>
                      <div>
                        <label className={labelClass}>Category <span className="text-[#DC2626]">*</span></label>
                        <select required value={form.sellerCategory}
                          onChange={(e) => setForm((f) => ({ ...f, sellerCategory: e.target.value }))}
                          className={inputClassBare}>
                          <option value="" disabled>Category</option>
                          {categories.map((c) => (<option key={c._id} value={c.name}>{c.name}</option>))}
                          <option value="General/Other">General / Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Store Name <span className="text-[#DC2626]">*</span></label>
                      <input type="text" required value={form.storeName}
                        onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                        placeholder="My Awesome Store" className={inputClassBare} />
                    </div>
                    <div className="pt-3 border-t border-[#E5E5E5]">
                      <p className="text-xs font-medium text-[#111111] mb-3">Bank Details</p>
                      <div className="space-y-3">
                        <input type="text" required value={form.bankName}
                          onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                          placeholder="Bank Name" className={inputClassBare} />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" required value={form.accountNumber}
                            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
                            placeholder="Account Number" maxLength={10} className={inputClassBare} />
                          <input type="text" required value={form.accountName}
                            onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                            placeholder="Account Name" className={inputClassBare} />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#E5E5E5] mt-4">
              {step > 1 && (
                <button type="button" onClick={handleBack} disabled={loading}
                  className="px-4 py-2.5 bg-white text-[#111111] font-medium rounded-md border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors text-sm">
                  Back
                </button>
              )}
              <button type="submit" disabled={loading}
                className={`py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-md transition-colors text-sm flex-1 disabled:opacity-60 disabled:cursor-not-allowed`}>
                {step < 3 ? "Continue →" : (loading ? "Creating…" : "Create Account")}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B6B6B] mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#2563EB] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
