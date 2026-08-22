"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/70 via-white to-amber-50/50 flex items-center justify-center px-4 font-sans">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-link-slash text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-gray-500 mb-6">
            This password reset link is invalid, incomplete, or missing parameters.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-block w-full py-3 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl transition-colors text-sm shadow-md"
          >
            Request a New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed. The link may have expired.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8]/70 via-white to-amber-50/50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-[#e8d48a]/50">

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
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <i className="fa-solid fa-circle-check text-emerald-600 text-3xl" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">Password Reset Complete!</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Your password has been successfully updated. You can now log in to your account with your new password.
              </p>
              <Link
                href="/auth/login"
                className="inline-block w-full py-3.5 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl transition-colors text-sm shadow-md"
              >
                Sign In to Your Account
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-extrabold text-gray-900 mb-1">Set New Password</h2>
                <p className="text-sm text-gray-500">Choose a new password for your account below.</p>
                <div className="mt-2 inline-block bg-[#fdf8e8] border border-[#e8d48a] rounded-lg px-3 py-1 text-xs text-[#A4860E] font-mono">
                  {email}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                  <i className="fa-solid fa-circle-exclamation mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-[#A4860E] transition-colors text-sm">
                      <i className="fa-solid fa-lock" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E] focus:border-transparent bg-gray-50/50 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-[#A4860E] transition-colors text-sm">
                      <i className="fa-solid fa-key" />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E] focus:border-transparent bg-gray-50/50 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#A4860E] hover:bg-[#8a6f0b] text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#A4860E]/20 active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fa-solid fa-circle-notch animate-spin" />
                      Updating Password...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#fdf8e8] to-yellow-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#e8d48a] border-t-[#A4860E] rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
