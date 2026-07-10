"use client";

import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Playful Illustration or Icon */}
        <div className="relative w-48 h-48 mx-auto mb-8 animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="absolute inset-0 bg-teal-100 rounded-full opacity-50 blur-2xl"></div>
          <div className="relative flex items-center justify-center h-full text-teal-500">
            <i className="fa-solid fa-ghost text-8xl"></i>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Oops! Page Not Found
        </h1>
        
        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          The product or page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            <i className="fa-solid fa-house"></i>
            Go to Homepage
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:border-teal-300 hover:text-teal-600 transition-all shadow-sm active:scale-95"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
            Search Products
          </Link>
        </div>
      </div>
    </div>
  );
}
