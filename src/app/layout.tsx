import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MarketHub — Multi-Vendor Marketplace",
    template: "%s | MarketHub",
  },
  description:
    "Buy and sell new & used products from verified sellers. Nigeria's modern multi-vendor marketplace.",
  keywords: ["marketplace", "buy", "sell", "ecommerce", "Nigeria"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} overflow-x-hidden`}>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
