"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BecomeSellerModal from "@/components/shared/BecomeSellerModal";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  title: string;
  navItems: NavItem[];
}

export default function DashboardSidebar({ title, navItems }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [openSellerModal, setOpenSellerModal] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard/buyer" || href === "/dashboard/seller" || href === "/dashboard/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-100 min-h-[calc(100vh-64px)] hidden md:block">
        <div className="p-5 sticky top-20">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#fdf8e8] text-[#A4860E]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className={active ? "text-[#A4860E]" : "text-gray-400"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Become a Seller card in sidebar for buyers */}
          {title === "Buyer Dashboard" && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#fdf8e8] to-amber-50 border border-[#e8d48a]/80 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#A4860E] text-white flex items-center justify-center text-xs mb-2.5 shadow-sm">
                  <i className="fa-solid fa-store" />
                </div>
                <h4 className="text-xs font-bold text-gray-900">Want to Sell?</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  List items and sell to campus students with 24-hr escrow.
                </p>
                <button
                  type="button"
                  onClick={() => setOpenSellerModal(true)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-[#A4860E] hover:bg-[#8a7009] text-white text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-[10px]" />
                  <span>Become a Seller</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {openSellerModal && (
        <BecomeSellerModal onClose={() => setOpenSellerModal(false)} />
      )}

      {/* ── Mobile Tab Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
        <nav className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0 ${
                  active ? "text-[#A4860E]" : "text-gray-400"
                }`}
              >
                <span className={`${active ? "text-[#A4860E]" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-medium truncate max-w-[60px] ${active ? "text-[#A4860E]" : "text-gray-500"}`}>
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

      {/* Bottom padding on mobile so content isn't hidden behind the tab bar */}
      <div className="h-16 md:hidden" aria-hidden />
    </>
  );
}
