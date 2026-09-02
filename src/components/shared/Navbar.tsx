"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import SearchBar from "@/components/shared/SearchBar";
import CartDrawer from "@/components/cart/CartDrawer";
import BecomeSellerModal from "@/components/shared/BecomeSellerModal";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface School {
  _id: string;
  name: string;
  slug: string;
  code?: string;
}

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

function NavbarInner() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.count);

  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [campusMenuOpen, setCampusMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [becomeSellerOpen, setBecomeSellerOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const campusMenuRef = useRef<HTMLDivElement>(null);

  const role = session?.user?.role ?? null;
  const roles = session?.user?.roles ?? [];
  const userSchool = session?.user?.school ?? null;
  const currentSchoolParam = searchParams?.get("school");

  const isbuyer = role === "buyer";
  const isSeller = role === "seller";
  const isAdmin = role === "admin";
  const hasBothRoles = roles.includes("buyer") && roles.includes("seller");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    fetch("/api/schools")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSchools(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setCampusMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (campusMenuRef.current && !campusMenuRef.current.contains(e.target as Node)) {
        setCampusMenuOpen(false);
      }
    }
    if (userMenuOpen || campusMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen, campusMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const switchRole = async (targetRole: string) => {
    if (switching) return;
    setSwitching(true);
    setMobileMenuOpen(false);
    try {
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
    } catch {
      // ignore
    } finally {
      setSwitching(false);
    }
  };

  const handleSellClick = () => {
    if (!session) {
      router.push("/auth/register?role=seller");
    } else if (isSeller) {
      router.push("/dashboard/seller");
    } else {
      setBecomeSellerOpen(true);
    }
  };

  const activeCampusLabel = currentSchoolParam
    ? currentSchoolParam === "all"
      ? "All Campuses"
      : currentSchoolParam
    : userSchool
    ? userSchool
    : "All Campuses";

  const avatarInitial = session?.user?.name?.[0]?.toUpperCase() || "U";
  const avatarGradient = isAdmin
    ? "from-purple-600 to-indigo-700"
    : isSeller
    ? "from-[#A4860E] to-[#c9a820]"
    : "from-gray-700 to-gray-900";

  return (
    <>
      <style>{`
        .scale-in { animation: scaleIn 0.18s cubic-bezier(0.16,1,0.3,1) forwards; transform-origin: top right; }
        .fade-in { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .nav-shadow { box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.03); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── MAIN TWO-TIER STICKY HEADER ────────────────────────────────────────────── */}
      <div className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 nav-shadow">
        
        {/* Tier 1: Main Header */}
        <div className="border-b border-gray-100">
          <div className="w-full max-w-[98%] 2xl:max-w-[1720px] mx-auto h-16 sm:h-20 flex items-center justify-between px-3 sm:px-6 gap-3 lg:gap-5">
            
            {/* Left: Brand Logo */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center group">
                <img
                  src="/main_logo.png"
                  alt="Marketplace Logo"
                  className="h-12 sm:h-16 w-auto object-contain group-hover:scale-102 transition-transform duration-200"
                />
              </Link>
            </div>

            {/* Center: Search Bar — md and above only */}
            <div className="hidden md:flex flex-1 max-w-3xl mx-2 lg:mx-6">
              <SearchBar />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              
              {/* Sell on Campus — desktop only */}
              {!isAdmin && (
                <button
                  onClick={handleSellClick}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#A4860E] to-[#bfa01d] hover:from-[#8f750b] hover:to-[#a88a12] text-white rounded-xl text-xs font-extrabold transition-all shadow-sm hover:shadow-md shrink-0"
                >
                  <i className="fa-solid fa-store text-xs" />
                  <span>{isSeller ? "Seller Hub" : "Sell on Campus"}</span>
                </button>
              )}

              {/* Wishlist — desktop only */}
              {isbuyer && (
                <Link
                  href="/dashboard/buyer/wishlist"
                  className="relative hidden lg:flex w-9 h-9 rounded-xl items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-100 hover:border-red-200"
                  title="My Wishlist"
                >
                  <i className="fa-regular fa-heart text-sm" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Account — desktop only, hidden on mobile */}
              {session && (
                <div className="relative hidden lg:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 shadow-2xs"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                      {avatarInitial}
                    </div>
                    <div className="text-left min-w-[60px]">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Account</p>
                      <p className="text-[12px] font-bold text-gray-900 leading-tight mt-0.5 truncate max-w-[80px]">
                        {session.user.name?.split(" ")[0]}
                      </p>
                    </div>
                    <i className={`fa-solid fa-chevron-down text-[8px] text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-50 scale-in overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/70">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
                            {avatarInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-gray-900 truncate">{session.user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                          </div>
                        </div>
                        {userSchool && (
                          <div className="mt-2 text-[11px] text-[#A4860E] font-bold flex items-center gap-1.5">
                            <i className="fa-solid fa-graduation-cap" />
                            <span className="truncate">{userSchool}</span>
                          </div>
                        )}
                        {(isSeller || isAdmin) && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isAdmin ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]"
                            }`}>
                              {role}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 space-y-1 text-xs">
                        <Link href={`/dashboard/${role}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-gray-700 hover:text-[#A4860E] hover:bg-[#fdf8e8] transition-all">
                          <i className="fa-solid fa-grid-2 w-4 text-center" />
                          Dashboard
                        </Link>
                        {isbuyer && (
                          <Link href="/dashboard/buyer/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-gray-700 hover:text-[#A4860E] hover:bg-[#fdf8e8] transition-all">
                            <i className="fa-solid fa-receipt w-4 text-center text-gray-400" />
                            My Orders &amp; Delivery PIN
                          </Link>
                        )}
                        {hasBothRoles && (
                          <div className="pt-2 mt-2 border-t border-gray-100">
                            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Switch View</p>
                            <button onClick={() => switchRole(isSeller ? "buyer" : "seller")} disabled={switching} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all text-left">
                              <i className="fa-solid fa-arrow-right-arrow-left w-4 text-center text-gray-400" />
                              {switching ? "Switching..." : `Switch to ${isSeller ? "Buyer" : "Seller"}`}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-2 border-t border-gray-100">
                        <button onClick={() => { setUserMenuOpen(false); setConfirmLogout(true); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all text-left">
                          <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Login / Register — desktop only */}
              {!session && (
                <div className="hidden lg:flex items-center gap-2">
                  <Link href="/auth/login" className="px-4 py-2 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-100 transition-colors border border-gray-200">
                    Log in
                  </Link>
                  <Link href="/auth/register" className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all">
                    Sign up
                  </Link>
                </div>
              )}

              {/* Cart — always visible */}
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 hover:border-gray-300 transition-all shadow-xs shrink-0"
                aria-label="Open shopping cart"
              >
                <div className="relative">
                  <i className="fa-solid fa-cart-shopping text-sm text-gray-800" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 w-4 h-4 bg-[#A4860E] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-bold">Cart</span>
              </button>

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setMobileSearchOpen((p) => !p)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-gray-200"
                aria-label="Toggle search"
              >
                <i className={`fa-solid ${mobileSearchOpen ? "fa-xmark" : "fa-magnifying-glass"} text-sm`} />
              </button>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-900 hover:bg-gray-100 border border-gray-200"
                aria-label="Open menu"
              >
                <i className="fa-solid fa-bars text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Category Bar */}
        <div className="bg-white/90 border-t border-gray-100">
          <div className="w-full max-w-[98%] 2xl:max-w-[1720px] mx-auto px-3 sm:px-6 flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
            
            {/* All Products CTA */}
            <Link
              href="/products"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all shrink-0 ${
                pathname === "/products" && !searchParams?.get("category")
                  ? "bg-gray-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-white border border-gray-200"
              }`}
            >
              <i className="fa-solid fa-border-all text-xs" />
              <span>All Products</span>
            </Link>

            {/* Hot Deals */}
            <Link
              href="/products?sort=-rating"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
            >
              <i className="fa-solid fa-fire text-rose-500 text-xs" />
              <span>Hot Deals</span>
            </Link>

            {/* Categories Pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              {categories.map((cat) => {
                const isSelected = searchParams?.get("category") === cat._id;
                return (
                  <Link
                    key={cat._id}
                    href={`/products?category=${cat._id}`}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? "bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <i className={`fa-solid ${getCatIcon(cat.name)} text-[11px] text-gray-400`} />
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Help & FAQs */}
            <Link
              href="/help"
              className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors whitespace-nowrap shrink-0"
            >
              <i className="fa-solid fa-circle-question text-gray-400" />
              <span>Help Center</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── MOBILE SEARCH PANEL ─────────────────────────────────────────── */}
      <div
        className={`md:hidden sticky top-16 left-0 right-0 z-30 bg-white border-b border-gray-200 overflow-hidden transition-all duration-200 ease-in-out ${
          mobileSearchOpen ? "max-h-24 py-3 px-4 opacity-100 shadow-md" : "max-h-0 py-0 px-4 opacity-0"
        }`}
      >
        <SearchBar />
      </div>

      {/* ── MOBILE SLIDE DRAWER ─────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-300 lg:hidden ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Dark Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setMobileMenuOpen(false)} />

        {/* Drawer Content */}
        <div
          className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <img src="/main_logo.png" alt="Marketplace Logo" className="h-12 w-auto object-contain" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-200 transition-colors"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Sell on Campus CTA Banner */}
            {!isAdmin && (
              <div className="p-4 m-4 bg-[#fdf8e8] border border-[#e8d48a] rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#e8d48a] flex items-center justify-center text-[#A4860E] shrink-0 font-bold">
                    <i className="fa-solid fa-store" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900">
                      {isSeller ? "Seller Control Hub" : "Sell to Students on Campus"}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {isSeller ? "Manage stock & incoming orders" : "Turn your items into cash today"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSellClick();
                  }}
                  className="w-full mt-3 py-2.5 bg-[#A4860E] hover:bg-[#8a7009] text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {isSeller ? "Go to Seller Dashboard →" : "Start Selling on Campus →"}
                </button>
              </div>
            )}

            {/* Campus Selector in Mobile Menu */}
            {schools.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Campus Filter
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  <Link
                    href="/products?school=all"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      activeCampusLabel === "All Campuses"
                        ? "bg-[#fdf8e8] text-[#A4860E] border-[#e8d48a]"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    All Campuses
                  </Link>
                  {schools.map((s) => (
                    <Link
                      key={s._id}
                      href={`/products?school=${encodeURIComponent(s.name)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex justify-between items-center ${
                        activeCampusLabel === s.name
                          ? "bg-[#fdf8e8] text-[#A4860E] border-[#e8d48a]"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {s.code && <span className="text-[10px] text-gray-500 font-mono">{s.code}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Account Status / Login */}
            {session ? (
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/70">
                <div className="flex items-center gap-3 mb-3 text-left">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0`}>
                    {avatarInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{session.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <Link
                    href={`/dashboard/${role}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#A4860E] hover:bg-[#fdf8e8] transition-colors"
                  >
                    <i className="fa-solid fa-grid-2 w-4 text-center" />
                    Dashboard
                  </Link>
                  {isbuyer && (
                    <Link
                      href="/dashboard/buyer/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-[#A4860E] hover:bg-[#fdf8e8] transition-colors"
                    >
                      <i className="fa-solid fa-receipt w-4 text-center text-gray-400" />
                      My Orders &amp; Delivery PIN
                    </Link>
                  )}
                  {hasBothRoles && (
                    <button
                      onClick={() => switchRole(isSeller ? "buyer" : "seller")}
                      disabled={switching}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-left"
                    >
                      <i className="fa-solid fa-arrow-right-arrow-left w-4 text-center text-gray-400" />
                      {switching ? "Switching..." : `Switch to ${isSeller ? "Buyer" : "Seller"}`}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-2.5">
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold shadow-xs"
                >
                  Create an account
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl bg-gray-100 text-gray-900 text-xs font-bold"
                >
                  Log in
                </Link>
              </div>
            )}

            {/* Navigation & Categories List */}
            <div className="px-4 py-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Marketplace
                </p>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                  >
                    <i className="fa-solid fa-house w-4 text-center text-gray-400" />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                  >
                    <i className="fa-solid fa-border-all w-4 text-center text-gray-400" />
                    <span>All Products</span>
                  </Link>
                  <Link
                    href="/products?sort=-rating"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <i className="fa-solid fa-fire w-4 text-center text-rose-500" />
                    <span>Hot Deals &amp; Discounts</span>
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                  >
                    <i className="fa-solid fa-shield-halved w-4 text-center text-emerald-500" />
                    <span>Safety &amp; Delivery PIN Guide</span>
                  </Link>
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Browse Categories
                  </p>
                  <div className="flex flex-col gap-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/products?category=${cat._id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition truncate"
                      >
                        <i className={`fa-solid ${getCatIcon(cat.name)} w-4 text-center text-gray-400 text-xs`} />
                        <span className="truncate">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Sign Out */}
          {session && (
            <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setConfirmLogout(true);
                }}
                className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {becomeSellerOpen && (
        <BecomeSellerModal onClose={() => setBecomeSellerOpen(false)} />
      )}

      {/* Logout Confirmation Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 fade-in">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm z-10 scale-in border border-gray-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fa-solid fa-power-off" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-1 tracking-tight">Sign out of CampusGo?</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              You will need to sign back in to access your orders, store inventory, and dashboard.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => signOut({ callbackUrl: window.location.origin + "/" })}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Yes, Sign Out
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-[104px] bg-white border-b border-gray-200" />}>
      <NavbarInner />
    </Suspense>
  );
}
