"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { registerSchema } from "@/utils/validators";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as "buyer" | "seller") ?? "buyer";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    hearAboutUs: "",
    nin: "",
    sellerCategory: "",
    role: defaultRole,
    storeName: "",
    storeDescription: "",
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
  const [devToken, setDevToken] = useState("");

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
              <i className="fa-solid fa-envelope" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your Email</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              We've sent a verification link to <strong className="text-gray-900">{form.email}</strong>. 
              Please check your email to activate your account.
            </p>
            <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 mb-6 text-xs text-green-800 text-left">
              <p className="font-bold mb-1"><i className="fa-solid fa-lightbulb" /> What&apos;s next?</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Check your spam/junk folder if you don't see it</li>
                <li>Ensure you complete verification within 24 hours</li>
              </ul>
            </div>
            {devToken && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-900 text-center shadow-sm">
                <p className="font-bold mb-2"><i className="fa-solid fa-code" /> Development Mode</p>
                <Link
                  href={`/auth/verify-email?token=${devToken}`}
                  className="inline-block w-full py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl transition-colors shadow-sm"
                >
                  Bypass Verification Now
                </Link>
              </div>
            )}
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Proceed to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/70 via-white to-amber-50/50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        {/* Premium glassmorphism card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-green-950/5 p-8 border border-green-100/50 hover:shadow-2xl hover:shadow-green-950/10 transition-all duration-300">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-green-600 group-hover:bg-green-700 flex items-center justify-center transition-colors shadow-md shadow-green-600/20">
                <span className="text-white font-black text-lg">M</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">Market<span className="text-green-600 group-hover:text-green-700 transition-colors">Hub</span></span>
            </Link>
            <p className="text-gray-500 mt-3 text-sm">Create your account and start today.</p>
          </div>

          {/* Role Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(["buyer", "seller"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: r }))}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  form.role === r ? "bg-white text-green-700 shadow-md" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {r === "buyer" ? <><i className="fa-solid fa-cart-shopping" /> Buyer</> : <><i className="fa-solid fa-store" /> Seller</>}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mobile Phone</label>
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

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">How did you hear about us?</label>
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

            {form.role === "seller" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">National Identification Number (NIN) <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm">
                      <i className="fa-solid fa-id-card" />
                    </span>
                    <input type="text" required value={form.nin}
                      onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "") }))}
                      placeholder="11-digit NIN"
                      maxLength={11}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Product Category to Sell <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm pointer-events-none">
                      <i className="fa-solid fa-bag-shopping" />
                    </span>
                    <select
                      required
                      value={form.sellerCategory}
                      onChange={(e) => setForm((f) => ({ ...f, sellerCategory: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                      <option value="General/Other">General / Other</option>
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none text-xs">
                      ▼
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-dashed border-gray-150">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Store Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={form.storeName}
                      onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                      placeholder="My Awesome Store"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50 focus:bg-white transition shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Store Description</label>
                    <textarea rows={3} value={form.storeDescription}
                      onChange={(e) => setForm((f) => ({ ...f, storeDescription: e.target.value }))}
                      placeholder="Tell buyers about your store..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50 focus:bg-white transition resize-none shadow-inner" />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-green-600/10 active:scale-[0.99] cursor-pointer">
              {loading ? "Creating account..." : "Create Account"}
            </button>
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
