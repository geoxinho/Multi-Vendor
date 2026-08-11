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
    ? "from-emerald-500 to-teal-600"
    : "from-blue-500 to-indigo-600";
  const roleBadgeStyle = isAdmin
    ? "bg-purple-100 text-purple-700 border-purple-200"
    : isSeller
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-blue-100 text-blue-700 border-blue-200";

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
              <Link href="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center shadow-lg shadow-gray-900/20 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-black text-sm tracking-tighter">MH</span>
                </div>
                <span className="font-extrabold text-xl text-gray-900 tracking-tight hidden sm:block">
                  Market<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Hub</span>
                </span>
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
                <button className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <i className="fa-solid fa-magnifying-glass" />
                </button>

                {isbuyer && (
                  <Link href="/dashboard/buyer/wishlist" className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors" title="Wishlist">
                    <i className="fa-regular fa-heart text-lg" />
                    {wishlistCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{wishlistCount > 9 ? "9+" : wishlistCount}</span>}
                  </Link>
                )}

                <button onClick={() => setCartOpen(true)} className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" aria-label="Open cart">
                  <i className="fa-solid fa-cart-shopping text-lg" />
                  {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{cartCount > 9 ? "9+" : cartCount}</span>}
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
                          <p className="text-[10px] capitalize text-gray-500 leading-none mt-0.5">{role}</p>
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
                            <div className="mt-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${roleBadgeStyle}`}>
                                {role}
                              </span>
                            </div>
                          </div>

                          <div className="p-2">
                            <Link href={`/dashboard/${role}`} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all">
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


      {/* ── MOBILE OVERLAY MENU ──────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 lg:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Frosted Background */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-3xl" onClick={() => setMobileMenuOpen(false)} />
        
        {/* Menu Content sliding up slightly */}
        <div className={`absolute inset-0 flex flex-col transition-transform duration-500 delay-75 ${mobileMenuOpen ? "translate-y-0" : "translate-y-8"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 shrink-0">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white font-black text-sm tracking-tighter">MH</span>
              </div>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-200 transition-colors">
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-24">
            {/* Primary Nav */}
            <div className="flex flex-col gap-4 mb-10 mt-4">
              {PUBLIC_NAV.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-[18px] text-gray-500 shrink-0">
                    <i className={`fa-solid ${link.icon}`} />
                  </span>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Account Section */}
            {session ? (
              <div className="mb-10 p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-xl ring-4 ring-white shadow-md`}>
                    {avatarInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-gray-900 truncate">{session.user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md uppercase">{role}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Link href={`/dashboard/${role}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white text-gray-900 font-bold hover:bg-blue-50 transition-colors shadow-sm">
                    <i className="fa-solid fa-grid-2 text-blue-600" />
                    Dashboard
                  </Link>
                  {hasBothRoles && (
                    <button onClick={() => switchRole(isSeller ? "buyer" : "seller")} disabled={switching} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm mt-2 text-left">
                      <i className="fa-solid fa-arrow-right-arrow-left text-gray-400" />
                      {switching ? "Switching..." : `Switch to ${isSeller ? "Buyer" : "Seller"}`}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-10">
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center py-4 rounded-full bg-gray-900 text-white text-lg font-bold shadow-xl shadow-gray-900/20">
                  Create an account
                </Link>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center py-4 rounded-full bg-gray-100 text-gray-900 text-lg font-bold">
                  Log in
                </Link>
              </div>
            )}

            {/* Categories Mobile */}
            {categories.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">Shop by Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <Link key={cat._id} href={`/products?category=${cat._id}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <i className={`fa-solid ${getCatIcon(cat.name)} text-gray-400`} />
                      <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile Footer logout */}
          {session && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 pointer-events-none">
              <button onClick={() => { setMobileMenuOpen(false); setConfirmLogout(true); }} className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-red-50 text-red-600 font-bold text-lg hover:bg-red-100 transition-colors pointer-events-auto">
                <i className="fa-solid fa-arrow-right-from-bracket" />
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
              <button onClick={() => signOut({ callbackUrl: window.location.origin })} className="w-full py-3.5 rounded-full bg-red-500 text-white font-bold text-base hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
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
