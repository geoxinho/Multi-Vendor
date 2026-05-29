"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No email verification token was provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Verification failed.");
        } else {
          setSuccess(true);
        }
      })
      .catch(() => {
        setError("An unexpected network error occurred. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                <span className="text-white font-black">M</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">Market<span className="text-green-600">Hub</span></span>
            </Link>
          </div>

          {loading && (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-700">Verifying your email...</h2>
              <p className="text-sm text-gray-400 mt-2">Just a moment while we activate your account.</p>
            </div>
          )}

          {!loading && success && (
            <div>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Thank you for verifying your email address. Your MarketHub account is now fully active. You can now log in and explore.
              </p>
              <Link
                href="/auth/login"
                className="inline-block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Sign In to Your Account
              </Link>
            </div>
          )}

          {!loading && error && (
            <div>
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold font-mono">
                ✕
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-sm text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100 mb-8 leading-relaxed text-left">
                {error}
              </p>
              <Link
                href="/auth/register"
                className="inline-block w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Register Again
              </Link>
            </div>
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
