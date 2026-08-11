import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import ProductGrid from "@/components/product/ProductGrid";
import type { Metadata } from "next";

const HOME_DESCRIPTION =
  "Shop thousands of new and used products from verified sellers across Nigeria. Payments secured by Paystack.";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://closevenders.vercel.app";

export const metadata: Metadata = {
  title: "CampusGo — Buy & Sell New and Used Products",
  description: HOME_DESCRIPTION,
  openGraph: {
    title: "CampusGo — Buy & Sell New and Used Products",
    description: HOME_DESCRIPTION,
    type: "website",
    siteName: "CampusGo",
    url: SITE_URL,
    images: [{ url: "/favicon.ico", alt: "CampusGo homepage" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusGo — Buy & Sell New and Used Products",
    description: HOME_DESCRIPTION,
  },
};

async function getFeaturedProducts() {
  try {
    await connectDB();
    const products = await Product.find({ status: "active", stock: { $gt: 0 } })
      .populate("seller", "name storeName avatar")
      .populate("category", "name slug")
      .sort("-createdAt")
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    await connectDB();
    const cats = await Category.find().sort("name").limit(8).lean();
    return JSON.parse(JSON.stringify(cats));
  } catch {
    return [];
  }
}

const CAT_ICONS: Record<string, string> = {
  electronics: "fa-laptop", fashion: "fa-shirt", phones: "fa-mobile-screen",
  shoes: "fa-shoe-prints", books: "fa-book", beauty: "fa-spray-can-sparkles",
  furniture: "fa-couch", sports: "fa-futbol", food: "fa-apple-whole",
  gaming: "fa-gamepad", toys: "fa-child-reaching", health: "fa-pills",
  supermarket: "fa-cart-shopping", appliances: "fa-blender", computing: "fa-computer",
  power: "fa-plug", home: "fa-house", office: "fa-briefcase",
};

function getCatIcon(name: string) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CAT_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "fa-bag-shopping";
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusGo Homepage",
    url: SITE_URL,
    description: HOME_DESCRIPTION,
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative border-b border-[#E5E5E5] bg-gradient-to-br from-[#F5F8FF] via-[#EEF4FF] to-white py-16 lg:py-24 overflow-hidden">
        {/* Background decorative glowing elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-blue-300/15 blur-[120px]" />
          <div className="absolute top-[40%] left-[10%] w-[35vw] h-[35vw] rounded-full bg-indigo-300/10 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold mb-6 border border-[#BFDBFE]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] inline-block animate-pulse" />
                Nigeria&apos;s Modern Marketplace
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#111111] leading-[1.1] tracking-tight mb-6">
                Shop Smart,<br />
                <span className="bg-gradient-to-r from-[#2563EB] to-[#4F46E5] bg-clip-text text-transparent animate-gradient">Sell Faster.</span>
              </h1>

              <p className="text-[#6B6B6B] text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                Thousands of new and used products from verified sellers. Every payment secured by Paystack.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] text-white font-bold rounded-md hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all text-sm"
                >
                  Browse Products
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-5">
                {[
                  { icon: "fa-circle-check", label: "Verified Sellers" },
                  { icon: "fa-shield-halved", label: "Secure Payments" },
                  { icon: "fa-bolt", label: "Fast Delivery" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <i className={`fa-solid ${b.icon} text-[#2563EB]`} />
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — premium dark stats cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-6 duration-700">
              {[
                { value: "10K+", label: "Active Listings", desc: "products live right now" },
                { value: "2K+", label: "Verified Sellers", desc: "active stores" },
                { value: "50K+", label: "Completed Orders", desc: "delivered nationwide" },
                { value: "Paystack", label: "Secured Checkout", desc: "100% protected checkout" },
              ].map((s, idx) => (
                <div key={idx} className="bg-[#111111] border border-[#222222] rounded-xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:border-[#333333] transition-all duration-300">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-normal">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES STRIP ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "fa-shield-halved", title: "Buyer Protection", desc: "Safe & secured checkout" },
            { icon: "fa-rocket", title: "Fast Delivery", desc: "Sellers ship nationwide" },
            { icon: "fa-circle-check", title: "Verified Sellers", desc: "Trusted seller profiles" },
            { icon: "fa-rotate-left", title: "Easy Returns", desc: "Hassle-free process" },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-md border border-[#E5E5E5] p-5 flex items-center gap-4 card-hover"
            >
              <span className="text-xl text-[#2563EB]">
                <i className={`fa-solid ${f.icon}`} />
              </span>
              <div>
                <p className="text-sm font-bold text-[#111111]">{f.title}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CATEGORIES ───────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-12 bg-[#FAFAFA] border-y border-[#E5E5E5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-[#111111] uppercase tracking-wider">
                Shop by Category
              </h2>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:underline"
              >
                View all categories
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Mobile Categories scroll */}
            <div
              className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((cat: { _id: string; name: string }) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat._id}`}
                  className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E5E5] text-xs font-semibold text-[#111111]"
                >
                  <i className={`fa-solid ${getCatIcon(cat.name)} text-[#9B9B9B]`} />
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>

            {/* Desktop Categories grid */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((cat: { _id: string; name: string }) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat._id}`}
                  className="flex items-center gap-3 p-3 rounded-md bg-white border border-[#E5E5E5] card-hover"
                >
                  <div className="w-8 h-8 shrink-0 rounded bg-[#FAFAFA] flex items-center justify-center border border-[#E5E5E5]">
                    <i className={`fa-solid ${getCatIcon(cat.name)} text-[#6B6B6B] text-xs`} />
                  </div>
                  <span className="text-sm font-semibold text-[#111111] truncate">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURED PRODUCTS ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-[#111111] uppercase tracking-wider">
              Latest Products
            </h2>
            <p className="text-[#6B6B6B] text-sm mt-0.5">
              Fresh arrivals from verified sellers
            </p>
          </div>
          <Link
            href="/products"
            className="text-[#2563EB] hover:underline text-sm font-medium flex items-center gap-1"
          >
            See all products
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-16 bg-white border border-[#E5E5E5] rounded-md">
            <p className="text-base font-semibold text-[#111111] mb-1">
              No products yet
            </p>
            <p className="text-[#6B6B6B] text-sm mb-6">
              Check back soon for new arrivals!
            </p>
            <Link
              href="/products"
              className="inline-block px-5 py-2.5 bg-[#2563EB] text-white font-bold rounded-md hover:bg-[#1D4ED8] transition-colors text-sm"
            >
              Browse Categories
            </Link>
          </div>
        )}
      </section>

      {/* ─── SELLER CTA ───────────────────────────────────────── */}
      <section className="bg-[#FAFAFA] border-t border-[#E5E5E5] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold border border-[#BFDBFE] mb-4">
                <i className="fa-solid fa-rocket" /> For Sellers
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#111111] leading-tight mb-4">
                Turn your inventory into income today.
              </h2>
              <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">
                Join thousands of sellers reaching buyers across Nigeria. List your products in minutes and start earning.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white font-bold rounded-md hover:bg-[#1D4ED8] transition-all text-sm"
                >
                  Create Your Store
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-[#111111] font-semibold rounded-md hover:bg-[#F5F5F5] border border-[#E5E5E5] transition-all text-sm"
                >
                  Browse Market
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "10K+", label: "Products Listed", faIcon: "fa-box" },
                { value: "2K+", label: "Active Sellers", faIcon: "fa-store" },
                { value: "50K+", label: "Happy Buyers", faIcon: "fa-face-smile" },
                { value: "99%", label: "Secure Payments", faIcon: "fa-lock" },
              ].map((s, idx) => (
                <div key={idx} className="bg-white border border-[#E5E5E5] rounded-md p-5">
                  <i className={`fa-solid ${s.faIcon} text-lg mb-2 block text-[#2563EB]`} />
                  <p className="text-xl font-bold text-[#111111]">{s.value}</p>
                  <p className="text-[#9B9B9B] text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
