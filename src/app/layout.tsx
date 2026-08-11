import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadataBase = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : new URL("https://closevendors.vercel.app");

const ROOT_DESCRIPTION =
  "Buy and sell new & used products from verified sellers. Nigeria's modern multi-vendor marketplace.";

export const metadata: Metadata = {
  title: {
    default: "CampusGo — Multi-Vendor Marketplace",
    template: "%s | CampusGo",
  },
  description: ROOT_DESCRIPTION,
  keywords: ["marketplace", "buy", "sell", "ecommerce", "Nigeria"],
  authors: [{ name: "CampusGo" }],
  openGraph: {
    title: "CampusGo — Multi-Vendor Marketplace",
    description: ROOT_DESCRIPTION,
    type: "website",
    siteName: "CampusGo",
    images: [
      {
        url: "/favicon.ico",
        alt: "CampusGo logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusGo — Multi-Vendor Marketplace",
    description: ROOT_DESCRIPTION,
    creator: "@CampusGo",
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const ROOT_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "CampusGo",
      url: metadataBase.toString(),
      logo: new URL("/favicon.ico", metadataBase).toString(),
      sameAs: [],
    },
    {
      "@type": "WebSite",
      name: "CampusGo",
      url: metadataBase.toString(),
      description: ROOT_DESCRIPTION,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} overflow-x-hidden`}>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ROOT_SCHEMA) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
