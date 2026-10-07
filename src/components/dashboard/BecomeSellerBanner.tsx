"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import BecomeSellerModal from "@/components/shared/BecomeSellerModal";
import Link from "next/link";

export default function BecomeSellerBanner() {
  const { data: session } = useSession();
  const [openModal, setOpenModal] = useState(false);

  const isAlreadySeller =
    session?.user?.role === "seller" ||
    (session?.user?.roles && session.user.roles.includes("seller"));

  if (isAlreadySeller) {
    return (
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-[#fdf8e8] to-amber-50 border border-[#e8d48a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#A4860E] text-white flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-store" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">You are an active seller!</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Manage your products, view seller orders, and track your escrow payouts.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/seller"
          className="px-5 py-2.5 rounded-xl bg-[#A4860E] hover:bg-[#8a7009] text-white font-bold text-xs transition-colors shadow-sm shrink-0"
        >
          Go to Seller Dashboard →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-[#1e1b12] text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-[#A4860E]/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A4860E]/30 text-[#e8d48a] text-xs font-bold mb-3 border border-[#A4860E]/40">
              <i className="fa-solid fa-sparkles text-xs" />
              <span>Earn Money on Campus</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Start Selling on CampusGo Today
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Have textbooks, gadgets, clothes, or student essentials to sell? Upgrade your account to a seller store and reach thousands of verified students with 24-hr escrow payout protection.
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="px-6 py-3.5 rounded-2xl bg-[#A4860E] hover:bg-[#c9a820] text-white font-extrabold text-xs transition-all shadow-lg shadow-[#A4860E]/30 shrink-0 flex items-center justify-center gap-2.5 hover:scale-102 active:scale-98 cursor-pointer"
          >
            <i className="fa-solid fa-store" />
            <span>Become a Seller</span>
          </button>
        </div>
      </div>

      {openModal && (
        <BecomeSellerModal onClose={() => setOpenModal(false)} />
      )}
    </>
  );
}
