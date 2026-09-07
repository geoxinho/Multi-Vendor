import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Products — Textbooks, Electronics & More | CampusGo",
  description:
    "Shop thousands of student listings — textbooks, electronics, fashion, food & dorm essentials from verified sellers at Adeleke University and Federal Polytechnic Ede. Safe escrow payments.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Browse Products — Textbooks, Electronics & More | CampusGo",
    description:
      "Shop thousands of student listings — textbooks, electronics, fashion, food & dorm essentials from verified sellers at Adeleke University and Federal Polytechnic Ede. Safe escrow payments.",
    url: "https://campusgo.vercel.app/products",
    siteName: "CampusGo",
    type: "website",
    images: [
      {
        url: "/main_logo.png",
        width: 1200,
        height: 630,
        alt: "Browse CampusGo — Nigeria's Campus Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Products — Textbooks, Electronics & More | CampusGo",
    description:
      "Shop thousands of student listings — textbooks, electronics, fashion, food & dorm essentials from verified sellers at Adeleke University and Federal Polytechnic Ede.",
    images: ["/main_logo.png"],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
