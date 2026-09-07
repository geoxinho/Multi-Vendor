import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support | CampusGo — Campus Marketplace Nigeria",
  description:
    "Need help? Get answers about orders, payments, seller verification, escrow protection, and refunds on CampusGo — Nigeria's trusted campus marketplace for university and polytechnic students.",
  alternates: {
    canonical: "/help",
  },
  openGraph: {
    title: "Help & Support | CampusGo",
    description:
      "Get answers about orders, payments, seller verification, escrow protection, and refunds on CampusGo — Nigeria's campus marketplace.",
    url: "https://campusgo.vercel.app/help",
    siteName: "CampusGo",
    type: "website",
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
