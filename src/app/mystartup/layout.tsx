import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal | CampusGo",
  description: "Restricted admin access portal for CampusGo administrators.",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
