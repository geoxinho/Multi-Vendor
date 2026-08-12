"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="bg-white rounded-md border border-[#E5E5E5] p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#A4860E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#111111] mb-2">Order Placed!</h1>
        <p className="text-sm text-[#6B6B6B] mb-4">Payment confirmed. Your order is being processed.</p>
        {orderId && (
          <p className="text-xs text-[#9B9B9B] mb-6 font-mono bg-[#FAFAFA] px-3 py-1.5 border border-[#E5E5E5] rounded-md">
            Order ID: {orderId}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/buyer/orders"
            className="block py-2.5 bg-[#A4860E] text-white font-semibold rounded-md hover:bg-[#8a6f0b] transition-colors text-sm">
            View My Orders
          </Link>
          <Link href="/products"
            className="block py-2.5 border border-[#E5E5E5] text-[#111111] font-medium rounded-md hover:bg-[#F5F5F5] transition-colors text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#A4860E] rounded-full animate-spin" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
