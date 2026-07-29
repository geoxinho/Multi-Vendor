"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
                      ? "bg-blue-50 text-[#2563EB]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className={active ? "text-[#2563EB]" : "text-gray-400"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

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
                  active ? "text-[#2563EB]" : "text-gray-400"
                }`}
              >
                <span className={`${active ? "text-[#2563EB]" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-medium truncate max-w-[60px] ${active ? "text-[#2563EB]" : "text-gray-500"}`}>
                  {item.label}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-[#2563EB]" />
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
