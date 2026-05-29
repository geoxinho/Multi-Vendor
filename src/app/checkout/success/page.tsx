"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Order Placed!</h1>
        <p className="text-gray-500 mb-2">Payment confirmed. Your order is being processed.</p>
        {orderId && (
          <p className="text-xs text-gray-400 mb-8 font-mono bg-gray-50 px-3 py-2 rounded-lg">
            Order ID: {orderId}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/buyer/orders"
            className="block py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
            View My Orders
          </Link>
          <Link href="/products"
            className="block py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

