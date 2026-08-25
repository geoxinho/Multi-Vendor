import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Desk & FAQ | CampusGo — Adeleke University Marketplace",
  description:
    "Get assistance with your orders, seller verification, 24-hr escrow payout questions, or report issues on CampusGo.",
  alternates: {
    canonical: "/help",
  },
  openGraph: {
    title: "Help Desk & FAQ | CampusGo",
    description:
      "Get assistance with your orders, seller verification, 24-hr escrow payout questions, or report issues on CampusGo.",
    url: "https://campusgo.vercel.app/help",
    siteName: "CampusGo",
    type: "website",
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
