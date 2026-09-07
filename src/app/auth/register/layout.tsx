import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | CampusGo — Campus Marketplace Nigeria",
  description:
    "Join CampusGo for free! Create an account to buy and sell textbooks, electronics, fashion & more safely between students at Adeleke University and Federal Polytechnic Ede.",
  alternates: { canonical: "/auth/register" },
  openGraph: {
    title: "Create Account | CampusGo",
    description: "Join CampusGo — Nigeria's trusted campus marketplace. Sign up free today.",
    url: "https://campusgo.vercel.app/auth/register",
    siteName: "CampusGo",
    type: "website",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
