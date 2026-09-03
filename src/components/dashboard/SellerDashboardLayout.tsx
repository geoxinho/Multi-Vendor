"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import RequireCampusModal from "@/components/dashboard/RequireCampusModal";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SellerDashboardLayoutProps {
  navItems: NavItem[];
  title: string;
  children: React.ReactNode;
}

export default function SellerDashboardLayout({ navItems, title, children }: SellerDashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fetchedStoreName, setFetchedStoreName] = useState<string>("");

  useEffect(() => {
    if (session?.user) {
      fetch("/api/seller/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.storeName) {
            setFetchedStoreName(data.storeName);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const displayName = fetchedStoreName || session?.user?.storeName || session?.user?.name || "Seller";

  const isActive = (href: string) => {
    if (href === "/dashboard/seller") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Filter out Settings and Messages from mobile bottom tab bar
  const mobileBottomNavItems = navItems.filter(
    (item) => item.label !== "Settings" && item.label !== "Messages"
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <RequireCampusModal />

      {/* ─── Desktop Sidebar ─── */}
      <aside className="w-64 shrink-0 bg-[#FAFAFA] border-r border-[#E5E5E5] text-gray-900 flex flex-col h-full hidden md:flex">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-[#E5E5E5]">
          <Link href="/" className="flex items-center gap-3">
            <img src="/main_logo.png" alt="Seller Dashboard Logo" className="h-10 w-auto object-contain" />
            <div>
              <p className="text-xs font-bold text-[#A4860E] tracking-wider uppercase">Seller Panel</p>
            </div>
          </Link>
        </div>

        {/* Seller profile */}
        {session?.user && (
          <div className="px-5 py-4 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A4860E] to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                  <i className="fa-solid fa-store text-xs text-[#A4860E]" />
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
            </div>
            <Link
              href="/dashboard/seller/settings"
              className="flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold text-[#A4860E] hover:bg-[#fdf8e8] hover:border-[#A4860E]/40 transition-colors"
            >
              <i className="fa-solid fa-pen-to-square text-xs" />
              Edit Profile
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">{title}</p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#A4860E] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className={active ? "text-white" : "text-gray-400"}>{item.icon}</span>
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F0C040]" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-[#E5E5E5] space-y-1">
          {/* Visit Website */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all group"
          >
            <i className="fa-solid fa-arrow-up-right-from-square w-5 text-center" />
            Visit Website
            <i className="fa-solid fa-chevron-right text-[10px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {/* Sign Out */}
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <i className="fa-solid fa-right-from-bracket w-5 text-center" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 h-14 flex items-center justify-between shrink-0">
          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 flex items-center justify-center"
            aria-label="Open menu"
          >
            <i className="fa-solid fa-bars text-lg" />
          </button>

          {/* Page breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">Seller Dashboard</span>
            {pathname.split("/").filter(Boolean).length > 2 && (
              <>
                <i className="fa-solid fa-chevron-right text-xs text-gray-300" />
                <span className="capitalize">{pathname.split("/").pop()?.replace(/-/g, " ")}</span>
              </>
            )}
          </div>

          {/* Right: Visit Website button */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#A4860E] hover:bg-[#8a7009] text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
            Visit Website
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* ─── Mobile sidebar drawer ─── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 md:hidden backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[70] w-72 bg-[#FAFAFA] text-gray-900 border-r border-[#E5E5E5] flex flex-col md:hidden shadow-2xl">
            <div className="px-5 py-5 border-b border-[#E5E5E5] flex items-center justify-between">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                <img src="/main_logo.png" alt="Seller Dashboard Logo" className="h-8 w-auto object-contain" />
                <p className="text-xs font-bold text-[#A4860E] tracking-wider uppercase">Seller Panel</p>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 flex items-center justify-center"
                aria-label="Close menu"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            {/* Mobile profile + edit */}
            {session?.user && (
              <div className="px-5 py-3 border-b border-[#E5E5E5]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A4860E] to-amber-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {displayName[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/seller/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold text-[#A4860E] hover:bg-[#fdf8e8] transition-colors"
                >
                  <i className="fa-solid fa-pen-to-square text-xs" />
                  Edit Profile
                </Link>
              </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">{title}</p>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-[#A4860E] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-4 border-t border-[#E5E5E5] space-y-1 bg-[#FAFAFA]">
              <Link
                href="/"
                target="_blank"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
              >
                <i className="fa-solid fa-arrow-up-right-from-square w-5 text-center text-[#A4860E]" />
                Visit Website
              </Link>
              <button
                onClick={() => { setMobileOpen(false); setConfirmLogout(true); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <i className="fa-solid fa-right-from-bracket w-5 text-center text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sign Out Confirmation Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <i className="fa-solid fa-right-from-bracket text-red-600 text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Sign out?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">You&apos;ll be redirected to the login page.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => signOut({ callbackUrl: window.location.origin + "/" })}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Tab Bar (Settings and Messages removed) ── */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg ${
          mobileOpen ? "hidden" : ""
        }`}
      >
        <nav className="flex items-center justify-around px-2 py-2">
          {mobileBottomNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 ${
                  active ? "text-[#A4860E]" : "text-gray-400"
                }`}
              >
                <span className={`${active ? "text-[#A4860E]" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-medium truncate max-w-[58px] ${active ? "text-[#A4860E] font-bold" : "text-gray-500"}`}>
                  {item.label}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-[#A4860E]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
