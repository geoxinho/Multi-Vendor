import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { auth } from "@/lib/auth";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadataBase = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : new URL("https://campusgo.vercel.app");

const ROOT_TITLE = "CampusGo — Adeleke University Campus Marketplace";
const ROOT_DESCRIPTION =
  "Nigeria's dedicated campus marketplace for Adeleke University students. Buy and sell textbooks, electronics, fashion, food, dorm & hostel essentials with instant 24-hr escrow protection.";

export const viewport: Viewport = {
  themeColor: "#A4860E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: ROOT_TITLE,
    template: "%s | CampusGo",
  },
  description: ROOT_DESCRIPTION,
  applicationName: "CampusGo",
  category: "Ecommerce Marketplace",
  keywords: [
    "CampusGo",
    "Adeleke University",
    "Adeleke University Marketplace",
    "campus marketplace",
    "student marketplace Nigeria",
    "buy textbooks Adeleke",
    "used electronics campus",
    "hostel essentials",
    "student commerce Ede Osun",
    "peer to peer student marketplace",
    "buy sell college campus",
  ],
  authors: [{ name: "CampusGo", url: "https://campusgo.vercel.app" }],
  creator: "CampusGo",
  publisher: "CampusGo",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: ROOT_TITLE,
    description: ROOT_DESCRIPTION,
    url: "https://campusgo.vercel.app",
    siteName: "CampusGo",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/main_logo.png",
        width: 1200,
        height: 630,
        alt: "CampusGo — Adeleke University Campus Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ROOT_TITLE,
    description: ROOT_DESCRIPTION,
    creator: "@CampusGo",
    site: "@CampusGo",
    images: ["/main_logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/main_logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/main_logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const ROOT_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${metadataBase.origin}/#organization`,
      name: "CampusGo",
      url: metadataBase.origin,
      logo: {
        "@type": "ImageObject",
        url: `${metadataBase.origin}/main_logo.png`,
      },
      description: ROOT_DESCRIPTION,
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Adeleke University, Ede, Osun State, Nigeria",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${metadataBase.origin}/#website`,
      url: metadataBase.origin,
      name: "CampusGo",
      publisher: {
        "@id": `${metadataBase.origin}/#organization`,
      },
      description: ROOT_DESCRIPTION,
      potentialAction: [
        {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${metadataBase.origin}/products?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      ],
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="overflow-x-hidden font-sans" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={metadataBase.origin} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden" suppressHydrationWarning>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ROOT_SCHEMA) }}
        />
        <Providers session={session}>
          {children}
        </Providers>
        {/* Vercel Analytics & Speed Insights for real-time monitoring */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
