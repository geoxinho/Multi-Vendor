"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/shared/SearchBar";
import CartDrawer from "@/components/cart/CartDrawer";
import BecomeSellerModal from "@/components/shared/BecomeSellerModal";

export default function Navbar() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.count);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [becomeSellerOpen, setBecomeSellerOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const role = session?.user.role ?? "buyer";
  const roles = session?.user.roles ?? [role];
  const isbuyer = role === "buyer";
  const isSeller = role === "seller";
  const hasBothRoles = roles.includes("buyer") && roles.includes("seller");

  const dashboardHref =
    role === "admin" ? "/dashboard/admin" :
    role === "seller" ? "/dashboard/seller" :
    "/dashboard/buyer";

  const switchRole = async (targetRole: string) => {
    if (switching) return;
    setSwitching(true);
    setMenuOpen(false);
    const res = await fetch("/api/user/switch-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: targetRole }),
    });
    const data = await res.json();
    if (res.ok) {
      await update({ role: data.role, roles: data.roles });
      router.push(targetRole === "seller" ? "/dashboard/seller" : "/dashboard/buyer");
      router.refresh();
    }
    setSwitching(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white font-black text-sm">M</span>
              </div>
              <span className="font-black text-xl text-gray-900 tracking-tight">
                Market<span className="text-teal-600">Hub</span>
              </span>
            </Link>

            {/* Search — hidden on mobile */}
            <div className="flex-1 hidden md:block max-w-xl">
              <SearchBar />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">

              {/* Wishlist icon — buyers only */}
              {isbuyer && (
                <Link
                  href="/dashboard/buyer/wishlist"
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-500"
                  title="My Wishlist"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart icon */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Open cart"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12M16 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors ml-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs">
                        {session.user.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {session.user.name}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">

                        {/* User info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                              role === "admin" ? "bg-purple-100 text-purple-700" :
                              role === "seller" ? "bg-blue-100 text-blue-700" :
                              "bg-teal-100 text-teal-700"
                            }`}>{role}</span>
                            {hasBothRoles && (
                              <span className="text-[10px] text-gray-400 font-medium">dual account</span>
                            )}
                          </div>
                        </div>

                        {/* Dashboard */}
                        <Link href={dashboardHref} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </Link>

                        {/* Wishlist — buyers */}
                        {isbuyer && (
                          <Link href="/dashboard/buyer/wishlist" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            My Wishlist
                          </Link>
                        )}

                        {/* Role actions — non-admins only */}
                        {role !== "admin" && (
                          <>
                            <hr className="my-1 border-gray-100" />

                            {/* Switch to Buyer (when active role is seller + has buyer role) */}
                            {hasBothRoles && isSeller && (
                              <button onClick={() => switchRole("buyer")} disabled={switching}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {switching ? "Switching…" : "Switch to Buyer"}
                              </button>
                            )}

                            {/* Switch to Seller (when active role is buyer + has seller role) */}
                            {hasBothRoles && isbuyer && (
                              <button onClick={() => switchRole("seller")} disabled={switching}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                {switching ? "Switching…" : "Switch to Seller"}
                              </button>
                            )}

                            {/* Start Selling removed as per request */}
                          </>
                        )}

                        <hr className="my-1 border-gray-100" />

                        {/* Sign out */}
                        <button
                          onClick={() => { setMenuOpen(false); setConfirmLogout(true); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Link href="/auth/login"
                    className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors rounded-xl hover:bg-gray-100">
                    Sign In
                  </Link>
                  <Link href="/auth/register"
                    className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile search */}
          <div className="pb-4 px-2 md:hidden">
            <SearchBar />
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Become Seller Modal */}
      {becomeSellerOpen && (
        <BecomeSellerModal onClose={() => setBecomeSellerOpen(false)} />
      )}

      {/* Logout Confirmation Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Sign out?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              You&apos;ll need to sign back in to access your account and orders.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors">
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
