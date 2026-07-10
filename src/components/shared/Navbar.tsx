"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import SearchBar from "@/components/shared/SearchBar";
import CartDrawer from "@/components/cart/CartDrawer";
import BecomeSellerModal from "@/components/shared/BecomeSellerModal";

interface Category { _id: string; name: string; slug: string }

const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
];

// Category icon map
const CAT_ICONS: Record<string, string> = {
  electronics: "fa-laptop",
  fashion: "fa-shirt",
  phones: "fa-mobile-screen",
  shoes: "fa-shoe-prints",
  books: "fa-book",
  beauty: "fa-spray-can-sparkles",
  furniture: "fa-couch",
  sports: "fa-futbol",
  food: "fa-apple-whole",
  gaming: "fa-gamepad",
  toys: "fa-child-reaching",
  health: "fa-pills",
  supermarket: "fa-cart-shopping",
  appliances: "fa-blender",
  computing: "fa-computer",
  power: "fa-plug",
  home: "fa-house",
  office: "fa-briefcase",
};

function getCatIcon(name: string) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CAT_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "fa-bag-shopping";
}

export default function Navbar() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.count);
  const [cartOpen, setCartOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [becomeSellerOpen, setBecomeSellerOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const role = session?.user.role ?? null;
  const roles = session?.user.roles ?? [];
  const isbuyer = role === "buyer";
  const isSeller = role === "seller";
  const isAdmin = role === "admin";
  const hasBothRoles = roles.includes("buyer") && roles.includes("seller");

  // Fetch categories for the side drawer
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const switchRole = async (targetRole: string) => {
    if (switching) return;
    setSwitching(true);
    setDrawerOpen(false);
    const res = await fetch("/api/user/switch-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: targetRole }),
    });
    const data = await res.json();
    if (res.ok) {
      await update({ role: data.role, roles: data.roles });
      router.push(targetRole === "seller" ? "/dashboard/seller" : "/");
      router.refresh();
    }
    setSwitching(false);
  };

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors px-1 pb-0.5 border-b-2 ${
          isActive
            ? "text-teal-600 border-teal-500"
            : "text-gray-600 border-transparent hover:text-teal-600 hover:border-teal-300"
        }`}
      >
        {label}
      </Link>
    );
  };

  const avatarColor = isAdmin
    ? "from-purple-500 to-purple-700"
    : isSeller
    ? "from-blue-500 to-blue-700"
    : "from-teal-400 to-teal-600";

  return (
    <>
      {/* ────────────────────────────────────────────────────────────── HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">

        {/* ── MOBILE TOP ROW: hamburger | logo | user + cart ── */}
        <div className="flex items-center h-14 px-3 gap-2 md:hidden">

          {/* Logo — left */}
          <Link href="/" className="flex items-center gap-1.5 group shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="font-black text-lg text-gray-900 tracking-tight">
              Market<span className="text-teal-600">Hub</span>
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right icons: User avatar + Cart + Hamburger */}
          <div className="flex items-center gap-1 shrink-0">

            {/* User icon / avatar */}
            {session ? (
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="relative p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Account"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs bg-gradient-to-br ${avatarColor}`}>
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
                {/* small verified dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
            ) : (
              <Link href="/auth/login" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600" aria-label="Sign in">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12M16 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Hamburger — right */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── MOBILE SEARCH ROW ── */}
        <div className="px-3 pb-2.5 md:hidden">
          <SearchBar />
        </div>

        {/* ── DESKTOP HEADER ── */}
        <div className="hidden md:flex items-center h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <span className="font-black text-xl text-gray-900 tracking-tight">
              Market<span className="text-teal-600">Hub</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-6 ml-6">
            {PUBLIC_NAV.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden md:block w-52 lg:w-72">
            <SearchBar />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Wishlist */}
            {isbuyer && (
              <Link href="/dashboard/buyer/wishlist"
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-500"
                title="Wishlist"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-teal-600"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12M16 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {session ? (
              <>
                <Link
                  href={`/dashboard/${role}`}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors font-semibold text-sm ml-2 border border-teal-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-white font-bold text-xs bg-gradient-to-br ${avatarColor}`}>
                      {session.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-gray-800 max-w-[90px] truncate leading-tight">{session.user.name}</p>
                      <p className={`text-[10px] capitalize font-medium leading-tight ${isAdmin ? "text-purple-600" : isSeller ? "text-blue-600" : "text-teal-600"}`}>{role}</p>
                    </div>
                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                        <div className="flex gap-1.5 mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${isAdmin ? "bg-purple-100 text-purple-700" : isSeller ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>{role}</span>
                          {hasBothRoles && <span className="text-[10px] text-gray-400 font-medium self-center">dual</span>}
                        </div>
                      </div>

                      {hasBothRoles && (
                        <>
                          <div className="px-4 pt-2 pb-1">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Switch role</p>
                          </div>
                          {isSeller && (
                            <button onClick={() => switchRole("buyer")} disabled={switching}
                              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              {switching ? "Switching…" : "Switch to Buyer"}
                            </button>
                          )}
                          {isbuyer && (
                            <button onClick={() => switchRole("seller")} disabled={switching}
                              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              {switching ? "Switching…" : "Switch to Seller"}
                            </button>
                          )}
                          <hr className="my-1 border-gray-100" />
                        </>
                      )}

                      <button
                        onClick={() => { setUserMenuOpen(false); setConfirmLogout(true); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/auth/login"
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors rounded-xl hover:bg-gray-100">
                  Sign In
                </Link>
                <Link href="/auth/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════ SLIDE-IN LEFT DRAWER */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 md:hidden ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[82vw] max-w-xs bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-teal-600">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="font-black text-base text-white tracking-tight">MarketHub</span>
          </Link>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg bg-white/20 text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── ACCOUNT SECTION ── */}
          {session ? (
            <div className="border-b border-gray-100">
              {/* Account header — tappable to go to dashboard */}
              <Link
                href={`/dashboard/${role}`}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${avatarColor}`}>
                    {session.user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      MY MARKETHUB ACCOUNT
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{session.user.name}</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Buyer-specific links */}
              {isbuyer && (
                <>
                  <DrawerLink icon="fa-box" label="Orders" href="/dashboard/buyer/orders" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-envelope" label="Inbox" href="/dashboard/buyer/messages" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-star" label="Pending Reviews" href="/dashboard/buyer/orders" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-heart" label="Wishlist" href="/dashboard/buyer/wishlist" onClose={() => setDrawerOpen(false)} />
                </>
              )}

              {/* Seller links */}
              {isSeller && (
                <>
                  <DrawerLink icon="fa-box" label="My Products" href="/dashboard/seller/products" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-bag-shopping" label="Orders" href="/dashboard/seller/orders" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-envelope" label="Messages" href="/dashboard/seller/messages" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-gear" label="Settings" href="/dashboard/seller/settings" onClose={() => setDrawerOpen(false)} />
                </>
              )}

              {/* Admin links */}
              {isAdmin && (
                <>
                  <DrawerLink icon="fa-users" label="Users" href="/dashboard/admin/users" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-box" label="Products" href="/dashboard/admin/products" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-bag-shopping" label="Orders" href="/dashboard/admin/orders" onClose={() => setDrawerOpen(false)} />
                </>
              )}

              {/* Role switch */}
              {hasBothRoles && (
                <>
                  {isSeller && (
                    <button onClick={() => switchRole("buyer")} disabled={switching}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50">
                      <i className="fa-solid fa-arrow-right-arrow-left w-5 text-center text-teal-500" />
                      {switching ? "Switching…" : "Switch to Buyer"}
                    </button>
                  )}
                  {isbuyer && (
                    <button onClick={() => switchRole("seller")} disabled={switching}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50">
                      <i className="fa-solid fa-arrow-right-arrow-left w-5 text-center text-blue-500" />
                      {switching ? "Switching…" : "Switch to Seller"}
                    </button>
                  )}
                </>
              )}

              {/* Sign Out */}
              <button
                onClick={() => { setDrawerOpen(false); setConfirmLogout(true); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                <i className="fa-solid fa-right-from-bracket w-5 text-center" />
                Sign Out
              </button>
            </div>
          ) : (
            /* Guest account section */
            <div className="border-b border-gray-100 p-4 flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Account</p>
              <Link href="/auth/login" onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition-colors">
                Get Started
              </Link>
            </div>
          )}

          {/* ── NAVIGATION ── */}
          <div className="border-b border-gray-100 py-2">
            {PUBLIC_NAV.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive ? "text-teal-700 bg-teal-50" : "text-gray-700 hover:bg-gray-50"}`}>
                  <i className={`fa-solid ${link.href === "/" ? "fa-house" : "fa-bag-shopping"} w-5 text-center text-gray-400`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── CATEGORIES SECTION ── */}
          {categories.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Our Categories</p>
                <Link href="/products" onClick={() => setDrawerOpen(false)}
                  className="text-xs font-semibold text-teal-600 hover:underline">
                  See All
                </Link>
              </div>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat._id}`}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <i className={`fa-solid ${getCatIcon(cat.name)} w-5 text-center text-gray-400`} />
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── CART DRAWER */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {becomeSellerOpen && (
        <BecomeSellerModal onClose={() => setBecomeSellerOpen(false)} />
      )}

      {/* ──────────────────────────────────────────────── SIGN OUT CONFIRM */}
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
              <button onClick={() => signOut({ callbackUrl: window.location.origin })}
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

// ────────────────────────────────────────── Reusable drawer link item
function DrawerLink({ icon, label, href, onClose }: {
  icon: string; label: string; href: string; onClose: () => void;
}) {
  return (
    <Link href={href} onClick={onClose}
      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
      <i className={`fa-solid ${icon} w-5 text-center text-gray-400`} />
      {label}
    </Link>
  );
}
