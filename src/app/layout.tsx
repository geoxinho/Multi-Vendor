import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";

export const metadataBase = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : new URL("https://campusgo.vercel.app");

const ROOT_DESCRIPTION =
  "Buy and sell new & used products from verified sellers at Adeleke University. CampusGo marketplace.";

export const metadata: Metadata = {
  title: {
    default: "CampusGo — Adeleke University Marketplace",
    template: "%s | CampusGo",
  },
  description: ROOT_DESCRIPTION,
  keywords: ["marketplace", "buy", "sell", "Adeleke University", "campus", "Nigeria"],
  authors: [{ name: "CampusGo" }],
  openGraph: {
    title: "CampusGo — Adeleke University Marketplace",
    description: ROOT_DESCRIPTION,
    type: "website",
    siteName: "CampusGo",
    images: [
      {
        url: "/main_logo.png",
        alt: "CampusGo logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusGo — Adeleke University Marketplace",
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
      logo: new URL("/main_logo.png", metadataBase).toString(),
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
    <html lang="en" className="overflow-x-hidden font-sans" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden" suppressHydrationWarning>
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
