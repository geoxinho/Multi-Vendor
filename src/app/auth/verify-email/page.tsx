"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/40 via-white to-amber-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center">
              <img
                src="/main_logo.png"
                alt="CampusGo Logo"
                className="h-16 w-auto object-contain hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          {success ? (
            <div>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Thank you for verifying your email address. Your CampusGo account is now fully active. You can now log in and explore.
              </p>
              <Link
                href="/auth/login"
                className="inline-block w-full py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl transition-colors shadow-md text-sm"
              >
                Sign In to Your Account
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Email</h2>
              <p className="text-sm text-gray-500 mb-8">
                Enter the 6-digit verification code sent to your email.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-left ml-1">Email Address</label>
                  <input type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E] bg-gray-50 focus:bg-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-left ml-1">Verification Code</label>
                  <input type="text" required value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#A4860E] bg-gray-50 focus:bg-white transition" />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium text-left">
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md cursor-pointer">
                  {loading ? "Verifying..." : "Verify Account"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
