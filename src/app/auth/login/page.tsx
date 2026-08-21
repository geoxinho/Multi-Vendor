"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/utils/validators";

const ROLE_HOME: Record<string, string> = {
  buyer: "/",
  seller: "/dashboard/seller",
  admin: "/dashboard/admin",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      const code = (res as { code?: string }).code;
      const knownMessages = [
        "No account found with this email address.",
        "Your account has been banned.",
        "Please verify your email address before logging in.",
        "Incorrect password. Please try again.",
      ];
      if (code && knownMessages.includes(code)) {
        setError(code);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } else {
      if (callbackUrl) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role ?? "buyer";
      router.push(ROLE_HOME[role] ?? "/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/30 via-white to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl md:max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <img src="/main_logo.png" alt="Marketplace Logo" className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] mt-6 mb-1">Sign in</h1>
          <p className="text-sm text-[#6B6B6B]">Welcome back to your account.</p>
        </div>

        <div className="border border-[#E5E5E5] rounded-2xl p-7 bg-white shadow-lg shadow-gray-100/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">Email</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#111111]">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#A4860E] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <i className="fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
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

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626]">
                <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-lg shadow-[#A4860E]/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>
          
          <p className="text-center text-[11px] text-[#9B9B9B] mt-4 leading-relaxed">
            By signing in, you agree to CampusGo&apos;s{" "}
            <Link href="/terms" target="_blank" className="text-[#A4860E] hover:underline font-semibold">Terms &amp; Conditions</Link>
            {" "}and{" "}
            <Link href="/privacy" target="_blank" className="text-[#A4860E] hover:underline font-semibold">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center text-sm text-[#6B6B6B] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-[#A4860E] font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#A4860E] rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
