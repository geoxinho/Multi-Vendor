import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | CampusGo — Campus Marketplace Nigeria",
  description:
    "Sign in to your CampusGo account to buy, sell, and manage orders on Nigeria's leading campus marketplace for Adeleke University and Federal Polytechnic Ede students.",
  alternates: { canonical: "/auth/login" },
  openGraph: {
    title: "Sign In | CampusGo",
    description: "Access your CampusGo account to shop and sell on campus.",
    url: "https://campusgo.vercel.app/auth/login",
    siteName: "CampusGo",
    type: "website",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
