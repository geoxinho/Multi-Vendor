import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { auth } from "@/lib/auth";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadataBase = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : new URL("https://campusgo.vercel.app");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://campusgo.vercel.app";

const ROOT_TITLE = "CampusGo — Nigeria's #1 Student Marketplace | Buy & Sell on Campus";
const ROOT_DESCRIPTION =
  "Nigeria's dedicated campus marketplace for students. Buy and sell textbooks, gadgets, smartphones, laptops, fashion, hostel essentials, and campus food safely with 24-hr escrow protection across Nigerian universities and polytechnics.";

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
  verification: {
    google: "vk7Pth0TYSQFGQef3xppKVdBcJRAaLhRR88kiPZuMII",
  },
  keywords: [
    "CampusGo",
    "Nigeria campus marketplace",
    "student marketplace Nigeria",
    "buy and sell on campus Nigeria",
    "student buyers Nigeria",
    "student sellers Nigeria",
    "campus vendor Nigeria",
    "buy used textbooks Nigerian universities",
    "student thrift market Nigeria",
    "campus second hand market",
    "buy laptops campus Nigeria",
    "hostel essentials Nigeria",
    "student ecommerce Nigeria",
    "peer to peer student marketplace",
    "campus escrow payment Nigeria",
    "Nigerian university students buy and sell",
    "polytechnic student marketplace Nigeria",
    "Unilag student market",
    "OAU campus marketplace",
    "UI student market",
    "UNN campus market",
    "FUTA campus marketplace",
    "Adeleke University marketplace",
    "Federal Polytechnic Ede marketplace",
    "UNILORIN student market",
    "Covenant University student market",
    "sell to students in Nigeria",
  ],
  authors: [{ name: "CampusGo", url: SITE_URL }],
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
    url: SITE_URL,
    siteName: "CampusGo",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/main_logo.png",
        width: 1200,
        height: 630,
        alt: "CampusGo — Nigeria's #1 Student Marketplace",
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
      "@id": `${SITE_URL}/#organization`,
      name: "CampusGo",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/main_logo.png`,
        width: 512,
        height: 512,
      },
      description: ROOT_DESCRIPTION,
      areaServed: {
        "@type": "Country",
        name: "Nigeria",
      },
      audience: {
        "@type": "Audience",
        audienceType: "Nigerian University & Polytechnic Students, Campus Sellers, Student Buyers",
      },
      sameAs: [SITE_URL],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "CampusGo",
      alternateName: "CampusGo Nigeria — Campus Marketplace",
      publisher: { "@id": `${SITE_URL}/#organization` },
      description: ROOT_DESCRIPTION,
      inLanguage: "en-NG",
      potentialAction: [
        {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      ],
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: ROOT_TITLE,
      description: ROOT_DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Browse Products", item: `${SITE_URL}/products` },
          { "@type": "ListItem", position: 3, name: "Help & Support", item: `${SITE_URL}/help` },
          { "@type": "ListItem", position: 4, name: "Terms of Service", item: `${SITE_URL}/terms` },
          { "@type": "ListItem", position: 5, name: "Privacy Policy", item: `${SITE_URL}/privacy` },
        ],
      },
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
