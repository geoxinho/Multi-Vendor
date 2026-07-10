"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
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
      <div className="min-h-screen bg-gradient-to-br from-green-50/70 via-white to-amber-50/50 flex items-center justify-center px-4 font-sans">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-link-slash text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-sm text-gray-500 mb-6">This password reset link is invalid or incomplete.</p>
          <Link href="/auth/forgot-password"
            className="inline-block w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors text-sm">
            Request a New Link
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
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/70 via-white to-amber-50/50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-green-950/5 p-8 border border-green-100/50">

          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-green-600 group-hover:bg-green-700 flex items-center justify-center transition-colors shadow-md shadow-green-600/20">
                <span className="text-white font-black text-lg">M</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">Market<span className="text-green-600">Hub</span></span>
            </Link>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <i className="fa-solid fa-check text-green-600 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Your password has been successfully updated. You can now use your new password to sign in.
              </p>
              <Link href="/auth/login"
                className="inline-block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-sm shadow-md">
                Sign In to Your Account
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Create New Password</h2>
                <p className="text-sm text-gray-500">Please enter your new password below.</p>
                <p className="text-xs text-gray-400 mt-2 font-mono">{email}</p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                  <i className="fa-solid fa-circle-exclamation mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">New Password</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm">
                      <i className="fa-solid fa-lock" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-green-600 transition-colors text-sm"
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Confirm New Password</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-green-600 transition-colors text-sm">
                      <i className="fa-solid fa-check-double" />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all shadow-inner"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-green-600 transition-colors text-sm"
                    >
                      <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-green-600/10 active:scale-[0.99]"
                >
                  {loading ? "Updating..." : "Reset Password"}
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
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
