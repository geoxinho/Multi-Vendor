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

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

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
        className={`text-sm font-medium transition-colors pb-0.5 border-b-2 ${
          isActive
            ? "text-[#2563EB] border-[#2563EB]"
            : "text-[#6B6B6B] border-transparent hover:text-[#111111] hover:border-[#E5E5E5]"
        }`}
      >
        {label}
      </Link>
    );
  };

  const avatarInitial = session?.user.name?.[0]?.toUpperCase();

  return (
    <>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E5E5]">

        {/* Mobile top row */}
        <div className="flex items-center h-14 px-4 gap-2 md:hidden">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="font-bold text-lg text-[#111111] tracking-tight">
              Market<span className="text-[#2563EB]">Hub</span>
            </span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-1 shrink-0">
            {session ? (
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="relative p-1.5 rounded-md hover:bg-[#F5F5F5] transition-colors"
                aria-label="Account"
              >
                <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs">
                  {avatarInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#16A34A] border-2 border-white rounded-full" />
              </button>
            ) : (
              <Link href="/auth/login" className="p-2 rounded-md hover:bg-[#F5F5F5] text-[#6B6B6B]" aria-label="Sign in">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-md hover:bg-[#F5F5F5] text-[#6B6B6B]"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12M16 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#2563EB] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-md hover:bg-[#F5F5F5] text-[#111111]"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 md:hidden">
          <SearchBar />
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex items-center h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-md bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <span className="font-bold text-xl text-[#111111] tracking-tight">
              Market<span className="text-[#2563EB]">Hub</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {PUBLIC_NAV.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          <div className="flex-1" />

          <div className="hidden md:block w-52 lg:w-72">
            <SearchBar />
          </div>

          <div className="flex items-center gap-1">
            {isbuyer && (
              <Link href="/dashboard/buyer/wishlist"
                className="relative p-2 rounded-md hover:bg-[#F5F5F5] text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
                title="Wishlist"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#DC2626] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-md hover:bg-[#F5F5F5] text-[#6B6B6B] hover:text-[#2563EB] transition-colors"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12M16 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#2563EB] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {session ? (
              <>
                <Link
                  href={`/dashboard/${role}`}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] transition-colors font-medium text-sm ml-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#F5F5F5] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs">
                      {avatarInitial}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-[#111111] max-w-[90px] truncate leading-tight">{session.user.name}</p>
                      <p className="text-[10px] capitalize text-[#6B6B6B] leading-tight">{role}</p>
                    </div>
                    <svg className={`w-3.5 h-3.5 text-[#9B9B9B] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-[#E5E5E5] rounded-lg py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-[#E5E5E5]">
                        <p className="text-sm font-semibold text-[#111111] truncate">{session.user.name}</p>
                        <p className="text-xs text-[#9B9B9B] truncate">{session.user.email}</p>
                        <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] capitalize">{role}</span>
                      </div>

                      {hasBothRoles && (
                        <>
                          <div className="px-4 pt-2 pb-1">
                            <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B] font-semibold">Switch role</p>
                          </div>
                          {isSeller && (
                            <button onClick={() => switchRole("buyer")} disabled={switching}
                              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-[#111111] hover:bg-[#F5F5F5] transition-colors">
                              <svg className="w-4 h-4 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              {switching ? "Switching…" : "Switch to Buyer"}
                            </button>
                          )}
                          {isbuyer && (
                            <button onClick={() => switchRole("seller")} disabled={switching}
                              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-[#111111] hover:bg-[#F5F5F5] transition-colors">
                              <svg className="w-4 h-4 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              {switching ? "Switching…" : "Switch to Seller"}
                            </button>
                          )}
                          <hr className="my-1 border-[#E5E5E5]" />
                        </>
                      )}

                      <button
                        onClick={() => { setUserMenuOpen(false); setConfirmLogout(true); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
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
                  className="px-3 py-1.5 text-sm font-medium text-[#111111] hover:bg-[#F5F5F5] rounded-md transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/register"
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-colors">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 md:hidden ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawerOpen(false)}
      />

      <div
        className={`fixed top-0 left-0 h-full w-[80vw] max-w-xs bg-white z-50 flex flex-col transition-transform duration-250 ease-in-out md:hidden border-r border-[#E5E5E5] ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#E5E5E5]">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="font-bold text-base text-[#111111]">MarketHub</span>
          </Link>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-md hover:bg-[#F5F5F5] text-[#6B6B6B]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <div className="border-b border-[#E5E5E5] py-1">
            {PUBLIC_NAV.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive ? "text-[#2563EB] bg-[#EFF6FF]" : "text-[#111111] hover:bg-[#F5F5F5]"}`}>
                  <i className={`fa-solid ${link.href === "/" ? "fa-house" : "fa-bag-shopping"} w-4 text-center text-[#9B9B9B]`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Account */}
          {session ? (
            <div className="border-b border-[#E5E5E5]">
              <Link href={`/dashboard/${role}`} onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F5F5F5] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm">
                    {avatarInitial}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wide">My Account</p>
                    <p className="text-sm font-semibold text-[#111111] truncate max-w-[160px]">{session.user.name}</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-[#9B9B9B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {isbuyer && (
                <>
                  <DrawerLink icon="fa-box" label="Orders" href="/dashboard/buyer/orders" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-envelope" label="Inbox" href="/dashboard/buyer/messages" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-heart" label="Wishlist" href="/dashboard/buyer/wishlist" onClose={() => setDrawerOpen(false)} />
                </>
              )}
              {isSeller && (
                <>
                  <DrawerLink icon="fa-box" label="My Products" href="/dashboard/seller/products" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-bag-shopping" label="Orders" href="/dashboard/seller/orders" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-gear" label="Settings" href="/dashboard/seller/settings" onClose={() => setDrawerOpen(false)} />
                </>
              )}
              {isAdmin && (
                <>
                  <DrawerLink icon="fa-users" label="Users" href="/dashboard/admin/users" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-box" label="Products" href="/dashboard/admin/products" onClose={() => setDrawerOpen(false)} />
                  <DrawerLink icon="fa-bag-shopping" label="Orders" href="/dashboard/admin/orders" onClose={() => setDrawerOpen(false)} />
                </>
              )}

              {hasBothRoles && (
                <>
                  {isSeller && (
                    <button onClick={() => switchRole("buyer")} disabled={switching}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#111111] hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]">
                      <i className="fa-solid fa-arrow-right-arrow-left w-4 text-center text-[#9B9B9B]" />
                      {switching ? "Switching…" : "Switch to Buyer"}
                    </button>
                  )}
                  {isbuyer && (
                    <button onClick={() => switchRole("seller")} disabled={switching}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#111111] hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]">
                      <i className="fa-solid fa-arrow-right-arrow-left w-4 text-center text-[#9B9B9B]" />
                      {switching ? "Switching…" : "Switch to Seller"}
                    </button>
                  )}
                </>
              )}

              {/* Sign Out has been moved to the fixed bottom panel */}
            </div>
          ) : null}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="py-1">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wide">Categories</p>
                <Link href="/products" onClick={() => setDrawerOpen(false)}
                  className="text-xs font-semibold text-[#2563EB] hover:underline">
                  See All
                </Link>
              </div>
              {categories.map((cat) => (
                <Link key={cat._id} href={`/products?category=${cat._id}`} onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111111] hover:bg-[#F5F5F5] transition-colors">
                  <i className={`fa-solid ${getCatIcon(cat.name)} w-4 text-center text-[#9B9B9B]`} />
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Bottom Action Panel */}
        <div className="p-4 border-t border-[#E5E5E5] bg-[#FAFAFA] shrink-0 mt-auto">
          {session ? (
            <button
              onClick={() => { setDrawerOpen(false); setConfirmLogout(true); }}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 text-sm text-[#DC2626] bg-red-50 border border-red-200/60 rounded-md font-bold hover:bg-red-100 transition-colors shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-right-from-bracket" />
              Sign Out
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/auth/login" onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center py-2.5 rounded-md border border-[#E5E5E5] text-[#111111] font-medium text-sm hover:bg-[#F5F5F5] transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center py-2.5 rounded-md bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {becomeSellerOpen && (
        <BecomeSellerModal onClose={() => setBecomeSellerOpen(false)} />
      )}

      {/* Sign out confirm */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white border border-[#E5E5E5] rounded-lg p-6 w-full max-w-sm z-10">
            <h2 className="text-lg font-bold text-[#111111] mb-1">Sign out?</h2>
            <p className="text-sm text-[#6B6B6B] mb-6">
              You'll need to sign back in to access your account.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2.5 rounded-md border border-[#E5E5E5] text-[#111111] font-medium text-sm hover:bg-[#F5F5F5] transition-colors">
                Cancel
              </button>
              <button onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-1 py-2.5 rounded-md bg-[#DC2626] text-white font-semibold text-sm hover:bg-red-700 transition-colors">
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DrawerLink({ icon, label, href, onClose }: {
  icon: string; label: string; href: string; onClose: () => void;
}) {
  return (
    <Link href={href} onClick={onClose}
      className="flex items-center gap-3 px-4 py-3 text-sm text-[#111111] hover:bg-[#F5F5F5] transition-colors">
      <i className={`fa-solid ${icon} w-4 text-center text-[#9B9B9B]`} />
      {label}
    </Link>
  );
}
