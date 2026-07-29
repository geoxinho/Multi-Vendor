import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal | MarketHub",
  description: "Restricted admin access portal for MarketHub administrators.",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
