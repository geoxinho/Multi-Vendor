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
    name: "",
    email: "",
    password: "",
    phone: "",
    hearAboutUs: "",
    school: "",
    nin: "",
    sellerCategory: "",
    role: defaultRole,
    storeName: "",
    storeDescription: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAutoVerified, setIsAutoVerified] = useState(false);
  const [devToken, setDevToken] = useState("");

  const handleNext = () => {
    setError("");
    // Basic validation before moving to next step
    if (step === 2) {
      if (!form.name || !form.email || !form.password || !form.phone) {
        setError("Please fill out all fields.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      if (!res.ok) { setError(data.error); setLoading(false); return; }

      if (data.devToken) {
        setDevToken(data.devToken);
      }
      if (data.autoVerified) {
        setIsAutoVerified(true);
      }
      setIsRegistered(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              <i className={isAutoVerified ? "fa-solid fa-check" : "fa-solid fa-envelope"} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isAutoVerified ? "Account Created!" : "Verify your Email"}
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {isAutoVerified ? (
                <>Your account <strong className="text-gray-900">{form.email}</strong> is ready to use.</>
              ) : (
                <>We've sent a verification link to <strong className="text-gray-900">{form.email}</strong>. Please check your email to activate your account.</>
              )}
            </p>
            {!isAutoVerified && (
              <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 mb-6 text-xs text-green-800 text-left">
                <p className="font-bold mb-1"><i className="fa-solid fa-lightbulb" /> What&apos;s next?</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Check your spam/junk folder if you don't see it</li>
                  <li>Enter the 6-digit code on the verification page</li>
                </ul>
              </div>
            )}
            {devToken && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-900 text-center shadow-sm">
                <p className="font-bold mb-2"><i className="fa-solid fa-code" /> Development Mode</p>
                <p>Your mock verification code is: <strong>{devToken}</strong></p>
              </div>
            )}
            {isAutoVerified ? (
              <Link
                href="/auth/login"
                className="inline-block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Proceed to Sign In
              </Link>
            ) : (
              <Link
                href={`/auth/verify-email?email=${encodeURIComponent(form.email)}`}
                className="inline-block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Enter Verification Code
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/70 via-white to-amber-50/50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        {/* Premium glassmorphism card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-green-950/5 p-8 border border-green-100/50 transition-all duration-300">
          
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-green-600 group-hover:bg-green-700 flex items-center justify-center transition-colors shadow-md shadow-green-600/20">
                <span className="text-white font-black text-lg">M</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">Market<span className="text-green-600">Hub</span></span>
            </Link>
            <p className="text-gray-500 mt-3 text-sm">Create your account and start today.</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? "bg-green-600 text-white shadow-md shadow-green-600/30 scale-110" :
                  step > s ? "bg-green-200 text-green-700" : "bg-gray-100 text-gray-400"
                }`}>
                  {step > s ? <i className="fa-solid fa-check" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-10 h-1 transition-all mx-1 rounded-full ${
                    step > s ? "bg-green-200" : "bg-gray-100"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-6 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
            
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">How do you want to use MarketHub?</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(["buyer", "seller"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r }))}
                      className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        form.role === r 
                          ? "border-green-600 bg-green-50 shadow-md shadow-green-600/10" 
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}
                    >
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl mb-3 transition-colors ${
                        form.role === r ? "bg-green-600 text-white" : "bg-gray-50 text-gray-400"
                      }`}>
                        <i className={`fa-solid ${r === "buyer" ? "fa-cart-shopping" : "fa-store"}`} />
                      </div>
                      <p className={`font-bold capitalize ${form.role === r ? "text-green-800" : "text-gray-600"}`}>
                        {r}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm">
                      <i className="fa-solid fa-user" />
                    </span>
                    <input type="text" required value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm">
                      <i className="fa-solid fa-envelope" />
                    </span>
                    <input type="email" required value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm">
                      <i className="fa-solid fa-key" />
                    </span>
                    <input type="password" required value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mobile Phone <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm">
                      <i className="fa-solid fa-phone" />
                    </span>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d+]/g, "") }))}
                      placeholder="e.g. 08012345678"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Specific Info */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {form.role === "buyer" ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Select your School <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm pointer-events-none">
                          <i className="fa-solid fa-graduation-cap" />
                        </span>
                        <select
                          required
                          value={form.school}
                          onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Select your school</option>
                          <option value="Adeleke University">Adeleke University</option>
                        </select>
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none text-xs">
                          ▼
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">How did you hear about us? <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm pointer-events-none">
                          <i className="fa-solid fa-bullhorn" />
                        </span>
                        <select
                          required
                          value={form.hearAboutUs}
                          onChange={(e) => setForm((f) => ({ ...f, hearAboutUs: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Select an option</option>
                          <option value="Social Media">Social Media (Twitter, Instagram, etc.)</option>
                          <option value="Friend/Referral">Friend / Referral</option>
                          <option value="Google Search">Google Search</option>
                          <option value="Advertisement">Advertisement</option>
                          <option value="Other">Other</option>
                        </select>
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none text-xs">
                          ▼
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">NIN <span className="text-red-500">*</span></label>
                        <input type="text" required value={form.nin}
                          onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "") }))}
                          placeholder="11-digit NIN"
                          maxLength={11}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Category <span className="text-red-500">*</span></label>
                        <select
                          required
                          value={form.sellerCategory}
                          onChange={(e) => setForm((f) => ({ ...f, sellerCategory: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="General/Other">General / Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Store Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={form.storeName}
                        onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                        placeholder="My Awesome Store"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50 focus:bg-white transition shadow-inner" />
                    </div>

                    <div className="pt-3 border-t border-dashed border-gray-200">
                      <p className="text-xs text-gray-600 font-bold mb-2">
                        <i className="fa-solid fa-building-columns text-green-600 mr-1" />
                        Bank Details
                      </p>
                      <div className="space-y-3">
                        <input type="text" required value={form.bankName}
                          onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                          placeholder="Bank Name"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50 focus:bg-white transition shadow-inner" />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" required value={form.accountNumber}
                            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
                            placeholder="Account Number"
                            maxLength={10}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50 focus:bg-white transition shadow-inner" />
                          <input type="text" required value={form.accountName}
                            onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                            placeholder="Account Name"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50 focus:bg-white transition shadow-inner" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="px-5 py-3.5 bg-white text-gray-600 hover:text-gray-900 font-bold rounded-xl border border-gray-200 transition-all shadow-sm w-1/3"
                >
                  Back
                </button>
              )}
              
              <button 
                type="submit" 
                disabled={loading}
                className={`py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-green-600/10 active:scale-[0.99] flex-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {step < 3 ? "Continue" : (loading ? "Creating account..." : "Create Account")}
              </button>
            </div>

          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-green-600 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
