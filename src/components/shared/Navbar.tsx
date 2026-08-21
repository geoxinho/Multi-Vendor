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
  { href: "/", label: "Home", icon: "fa-house" },
  { href: "/products", label: "Products", icon: "fa-bag-shopping" },
];

const CAT_ICONS: Record<string, string> = {
  electronics: "fa-laptop", fashion: "fa-shirt", phones: "fa-mobile-screen",
  shoes: "fa-shoe-prints", books: "fa-book", beauty: "fa-spray-can-sparkles",
  furniture: "fa-couch", sports: "fa-futbol", food: "fa-apple-whole",
  gaming: "fa-gamepad", toys: "fa-child-reaching", health: "fa-pills",
  supermarket: "fa-cart-shopping", appliances: "fa-blender", computing: "fa-computer",
  power: "fa-plug", home: "fa-house", office: "fa-briefcase",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [becomeSellerOpen, setBecomeSellerOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scrolled, setScrolled] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);

  const role = session?.user.role ?? null;
  const roles = session?.user.roles ?? [];
  const isbuyer = role === "buyer";
  const isSeller = role === "seller";
  const isAdmin = role === "admin";
  const hasBothRoles = roles.includes("buyer") && roles.includes("seller");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const switchRole = async (targetRole: string) => {
    if (switching) return;
    setSwitching(true);
    setMobileMenuOpen(false);
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

  const avatarInitial = session?.user.name?.[0]?.toUpperCase();
  const avatarGradient = isAdmin
    ? "from-purple-500 to-violet-600"
    : isSeller
    ? "from-[#A4860E] to-[#c9a820]"
    : "from-gray-400 to-gray-600";
  const roleBadgeStyle = isAdmin
    ? "bg-purple-100 text-purple-700 border-purple-200"
    : "bg-[#fdf8e8] text-[#A4860E] border-[#e8d48a]";

  return (
    <>
      <style>{`
        .scale-in { animation: scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards; transform-origin: top right; }
        .fade-in { animation: fadeIn 0.25s ease-out forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .premium-shadow { box-shadow: 0 8px 32px -8px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04); }
        .hover-lift { transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1); }
        .hover-lift:hover { transform: translateY(-1px); }
      `}</style>

      {/* ── FIXED DESKTOP HEADER ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-gray-200 shadow-sm shadow-gray-200/30 transition-all duration-300">
        <header className="mx-auto max-w-7xl h-16 flex items-center justify-between px-4 sm:px-6 gap-4 lg:gap-8">
            
            {/* Left: Logo */}
            <div className="flex-1 flex justify-start">
              <Link href="/" className="flex items-center shrink-0 group">
                <img src="/main_logo.png" alt="Marketplace Logo" className="h-12 md:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
              </Link>
            </div>

            {/* Center: Nav Pills */}
            <nav className="hidden lg:flex items-center justify-center gap-1 shrink-0 bg-gray-100/50 p-1 rounded-full border border-gray-200/50">
              {PUBLIC_NAV.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link key={link.href} href={link.href} className="relative group px-5 py-2 rounded-full transition-all duration-300">
                    {isActive && <span className="absolute inset-0 bg-white rounded-full shadow-sm border border-gray-200/60" />}
                    <span className={`relative text-sm font-bold tracking-wide transition-colors duration-300 ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-800'}`}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex-1 flex items-center justify-end gap-2 lg:gap-4 min-w-0">
              
              <div className="hidden md:block w-48 lg:w-72 shrink">
                <SearchBar />
              </div>

              <div className="flex items-center gap-1.5 pl-2 lg:pl-0">
                {/* Search Toggle Mobile */}
                <button
                  onClick={() => setMobileSearchOpen((p) => !p)}
                  className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Toggle search"
                >
                  <i className={`fa-solid ${mobileSearchOpen ? "fa-xmark" : "fa-magnifying-glass"}`} />
                </button>

                {isbuyer && (
                  <Link href="/dashboard/buyer/wishlist" className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors" title="Wishlist">
                    <i className="fa-regular fa-heart text-lg" />
                    {wishlistCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{wishlistCount > 9 ? "9+" : wishlistCount}</span>}
                  </Link>
                )}

                <button onClick={() => setCartOpen(true)} className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-[#A4860E] hover:bg-[#fdf8e8] transition-colors" aria-label="Open cart">
                  <i className="fa-solid fa-cart-shopping text-lg" />
                  {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-[#A4860E] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{cartCount > 9 ? "9+" : cartCount}</span>}
                </button>

                {/* Mobile Menu Toggle */}
                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors ml-1">
                  <div className="flex flex-col gap-[4px] items-center">
                    <span className="block w-4 h-[2px] bg-current rounded-full" />
                    <span className="block w-4 h-[2px] bg-current rounded-full" />
                  </div>
                </button>

                {/* Desktop User Section */}
                <div className="hidden lg:block ml-2">
                  {session ? (
                    <div className="relative" ref={userMenuRef}>
                      <button onClick={() => setUserMenuOpen((p) => !p)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm`}>
                          {avatarInitial}
                        </div>
                        <div className="text-left">
                          <p className="text-[13px] font-bold text-gray-900 leading-none max-w-[100px] truncate">{session.user.name}</p>
                          {role !== "buyer" && (
                            <p className="text-[10px] capitalize text-gray-500 leading-none mt-0.5">{role}</p>
                          )}
                        </div>
                        <i className={`fa-solid fa-chevron-down text-[10px] text-gray-400 ml-1 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                      </button>

                      {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl shadow-gray-200/50 py-2 z-50 scale-in overflow-hidden">
                          <div className="px-5 py-4 border-b border-gray-100/50 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
                                {avatarInitial}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold text-gray-900 truncate">{session.user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                              </div>
                            </div>
                            {(isSeller || isAdmin) && (
                              <div className="mt-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${roleBadgeStyle}`}>
                                  {role}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-2">
                            <Link href={`/dashboard/${role}`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-[#A4860E] hover:bg-[#fdf8e8] transition-all">
                              <i className="fa-solid fa-grid-2 w-4 text-center" />
                              Dashboard
                            </Link>

                            {hasBothRoles && (
                              <div className="mt-2 mb-2">
                                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Switch View</p>
                                {isSeller ? (
                                  <button onClick={() => switchRole("buyer")} disabled={switching} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all text-left">
                                    <i className="fa-solid fa-arrow-right-arrow-left w-4 text-center text-gray-400" />
                                    {switching ? "Switching..." : "Switch to Buyer"}
                                  </button>
                                ) : (
                                  <button onClick={() => switchRole("seller")} disabled={switching} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all text-left">
                                    <i className="fa-solid fa-arrow-right-arrow-left w-4 text-center text-gray-400" />
                                    {switching ? "Switching..." : "Switch to Seller"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="p-2 border-t border-gray-100">
                            <button onClick={() => { setUserMenuOpen(false); setConfirmLogout(true); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all text-left">
                              <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href="/auth/login" className="whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                        Log in
                      </Link>
                      <Link href="/auth/register" className="whitespace-nowrap shrink-0 hover-lift px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md shadow-gray-900/20 hover:bg-black transition-all">
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </header>
      </div>

      {/* ── MOBILE SEARCH PANEL ─────────────────────────────────────────── */}
      <div className={`md:hidden sticky top-16 left-0 right-0 z-30 bg-white border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${mobileSearchOpen ? "max-h-20 py-3 px-4 opacity-100" : "max-h-0 py-0 px-4 opacity-0"}`}>
        <SearchBar />
      </div>

      {/* ── MOBILE SIDE DRAWER ──────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 lg:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Dark Overlay Background */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
        
        {/* Drawer Content sliding from left */}
        <div className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <img src="/main_logo.png" alt="Marketplace Logo" className="h-11 w-auto object-contain" />
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-200 transition-colors">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Account Section (if logged in) */}
            {session ? (
              <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-4 text-left">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-lg ring-2 ring-white shadow-sm shrink-0`}>
                    {avatarInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{session.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                    {(isSeller || isAdmin) && (
                      <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 bg-[#fdf8e8] text-[#A4860E] rounded-md uppercase border border-[#e8d48a]">{role}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <Link href={`/dashboard/${role}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 hover:text-[#A4860E] hover:bg-[#fdf8e8] transition-colors">
                    <i className="fa-solid fa-grid-2 w-4 text-center" />
                    Dashboard
                  </Link>
                  {hasBothRoles && (
                    <button onClick={() => switchRole(isSeller ? "buyer" : "seller")} disabled={switching} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-left">
                      <i className="fa-solid fa-arrow-right-arrow-left w-4 text-center text-gray-400" />
                      {switching ? "Switching..." : `Switch to ${isSeller ? "Buyer" : "Seller"}`}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-6 py-6 border-b border-gray-100 flex flex-col gap-3">
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center py-3 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md shadow-gray-900/20">
                  Create an account
                </Link>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center py-3 rounded-full bg-gray-100 text-gray-900 text-sm font-bold">
                  Log in
                </Link>
              </div>
            )}

            {/* Primary Nav */}
            <div className="px-3 py-4">
              <p className="px-4 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Menu</p>
              <div className="flex flex-col gap-1">
                {PUBLIC_NAV.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-100 transition-colors text-left">
                    <i className={`fa-solid ${link.icon} w-5 text-center text-gray-400`} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories Mobile */}
            {categories.length > 0 && (
              <div className="px-3 py-2 pb-6">
                <p className="px-4 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Categories</p>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <Link key={cat._id} href={`/products?category=${cat._id}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors text-left">
                      <i className={`fa-solid ${getCatIcon(cat.name)} w-5 text-center text-gray-400`} />
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile Footer logout */}
          {session && (
            <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
              <button onClick={() => { setMobileMenuOpen(false); setConfirmLogout(true); }} className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left">
                <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center" />
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

      {/* Sign out confirm modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 fade-in">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl shadow-black/20 p-8 w-full max-w-sm z-10 scale-in">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-power-off text-2xl text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 text-center mb-2 tracking-tight">Sign out?</h2>
            <p className="text-base text-gray-500 text-center mb-8">
              You&apos;ll need to sign back in to access your dashboard and saved items.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => signOut({ callbackUrl: window.location.origin + "/" })} className="w-full py-3.5 rounded-full bg-red-500 text-white font-bold text-base hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
                Yes, Sign Out
              </button>
              <button onClick={() => setConfirmLogout(false)} className="w-full py-3.5 rounded-full bg-gray-100 text-gray-700 font-bold text-base hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
