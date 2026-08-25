import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Products | CampusGo — Adeleke University Marketplace",
  description:
    "Explore deals on textbooks, electronics, dorm essentials, fashion, gadgets and student items from verified sellers at Adeleke University.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Browse Products | CampusGo — Adeleke University Marketplace",
    description:
      "Explore deals on textbooks, electronics, dorm essentials, fashion, gadgets and student items from verified sellers at Adeleke University.",
    url: "https://campusgo.vercel.app/products",
    siteName: "CampusGo",
    type: "website",
    images: [
      {
        url: "/main_logo.png",
        width: 1200,
        height: 630,
        alt: "Browse CampusGo Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Products | CampusGo — Adeleke University Marketplace",
    description:
      "Explore deals on textbooks, electronics, dorm essentials, fashion, gadgets and student items from verified sellers at Adeleke University.",
    images: ["/main_logo.png"],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
