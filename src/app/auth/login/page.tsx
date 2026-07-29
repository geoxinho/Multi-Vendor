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
          <h1 className="text-xl font-bold text-[#111111] mt-6 mb-1">Sign in</h1>
          <p className="text-sm text-[#6B6B6B]">Welcome back.</p>
        </div>

        <div className="border border-[#E5E5E5] rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1.5">Email</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-md border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#2563EB] transition-colors bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#111111]">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#2563EB] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <i className="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] text-xs" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-md border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#2563EB] transition-colors bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] text-xs"
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-md text-xs text-[#DC2626]">
                <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-md transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B6B6B] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-[#2563EB] font-medium hover:underline">
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
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
