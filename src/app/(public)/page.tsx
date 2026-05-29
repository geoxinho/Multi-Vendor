import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import ProductGrid from "@/components/product/ProductGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MarketHub — Buy & Sell New and Used Products",
  description: "Shop thousands of new and used products from verified sellers across Nigeria. Payments secured by Paystack.",
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
}const CATEGORY_META: Record<string, { icon: string; faIcon: string; gradient: string; iconBg: string; text: string }> = {
  electronics: { icon: "💻", faIcon: "fa-laptop",          gradient: "from-blue-500 to-indigo-600",    iconBg: "bg-blue-100",   text: "text-blue-700" },
  fashion:     { icon: "👗", faIcon: "fa-shirt",           gradient: "from-pink-500 to-rose-600",      iconBg: "bg-pink-100",   text: "text-pink-700" },
  phones:      { icon: "📱", faIcon: "fa-mobile-screen",   gradient: "from-violet-500 to-purple-600",  iconBg: "bg-violet-100", text: "text-violet-700" },
  shoes:       { icon: "👟", faIcon: "fa-shoe-prints",     gradient: "from-orange-500 to-amber-600",   iconBg: "bg-orange-100", text: "text-orange-700" },
  books:       { icon: "📚", faIcon: "fa-book",            gradient: "from-teal-500 to-emerald-600",   iconBg: "bg-teal-100",   text: "text-teal-700" },
  beauty:      { icon: "💄", faIcon: "fa-spray-can-sparkles", gradient: "from-fuchsia-500 to-pink-600", iconBg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  furniture:   { icon: "🛋️", faIcon: "fa-couch",           gradient: "from-amber-500 to-yellow-600",   iconBg: "bg-amber-100",  text: "text-amber-700" },
  sports:      { icon: "⚽", faIcon: "fa-futbol",          gradient: "from-green-500 to-teal-600",     iconBg: "bg-green-100",  text: "text-green-700" },
  food:        { icon: "🍎", faIcon: "fa-apple-whole",     gradient: "from-red-500 to-rose-600",       iconBg: "bg-red-100",    text: "text-red-700" },
  gaming:      { icon: "🎮", faIcon: "fa-gamepad",         gradient: "from-purple-500 to-indigo-600",  iconBg: "bg-purple-100", text: "text-purple-700" },
  toys:        { icon: "🧸", faIcon: "fa-child-reaching",  gradient: "from-yellow-400 to-orange-500",  iconBg: "bg-yellow-100", text: "text-yellow-700" },
  health:      { icon: "💊", faIcon: "fa-pills",           gradient: "from-cyan-500 to-teal-600",      iconBg: "bg-cyan-100",   text: "text-cyan-700" },
};

const FALLBACK_GRADIENTS = [
  { gradient: "from-teal-500 to-cyan-600",     iconBg: "bg-teal-100",   text: "text-teal-700" },
  { gradient: "from-indigo-500 to-blue-600",   iconBg: "bg-indigo-100", text: "text-indigo-700" },
  { gradient: "from-rose-500 to-pink-600",     iconBg: "bg-rose-100",   text: "text-rose-700" },
  { gradient: "from-amber-500 to-orange-600",  iconBg: "bg-amber-100",  text: "text-amber-700" },
];

function getCategoryMeta(name: string, index: number) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_META)) {
    if (key.includes(k)) return { faIcon: v.faIcon, ...v };
  }
  const fallback = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  return { faIcon: "fa-bag-shopping", gradient: fallback.gradient, iconBg: fallback.iconBg, text: fallback.text };
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div className="overflow-x-hidden">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-700 to-teal-600 overflow-hidden min-h-[88vh] flex items-center">

        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[400px] h-[400px] rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-teal-800/30 blur-3xl" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold mb-6 border border-white/15 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-teal-300 pulse-dot inline-block" />
                Nigeria&apos;s Modern Marketplace
              </span>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
                Shop Smart,<br />
                <span className="text-teal-300">Sell Faster.</span>
              </h1>

              <p className="text-teal-100 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
                Thousands of new &amp; used products from verified sellers. Every payment protected by Paystack.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/products"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-teal-700 font-bold rounded-2xl hover:bg-teal-50 transition-all shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/25 hover:-translate-y-0.5 text-base">
                  Browse Products
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-500/20 text-white font-semibold rounded-2xl hover:bg-teal-500/30 transition-all border border-white/20 backdrop-blur-sm text-base">
                  Start Selling →
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6">
                {[
                  { icon: <i className="fa-solid fa-check text-teal-300 font-bold" />, label: "Verified Sellers" },
                  { icon: <i className="fa-solid fa-lock text-teal-300" />, label: "Secure Payments" },
                  { icon: <i className="fa-solid fa-bolt text-teal-300" />, label: "Fast Delivery" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-teal-100 text-sm">
                    <span className="text-teal-300 font-bold">{b.icon}</span>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating stat cards */}
            <div className="hidden lg:flex flex-col gap-4 items-end">
              {/* Big stat */}
              <div className="float bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-64 shadow-2xl">
                <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Active Listings</p>
                <p className="text-white text-4xl font-extrabold">10K+</p>
                <p className="text-teal-300 text-xs mt-1">products live right now</p>
              </div>

              <div className="flex gap-4" style={{ animationDelay: "1s" }}>
                <div className="float bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 w-36 shadow-xl" style={{ animationDelay: "0.5s" }}>
                  <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Sellers</p>
                  <p className="text-white text-2xl font-extrabold">2K+</p>
                  <p className="text-teal-300 text-[11px] mt-0.5">verified stores</p>
                </div>
                <div className="float bg-teal-400/20 backdrop-blur-md border border-teal-300/30 rounded-3xl p-5 w-36 shadow-xl" style={{ animationDelay: "1s" }}>
                  <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Orders</p>
                  <p className="text-white text-2xl font-extrabold">50K+</p>
                  <p className="text-teal-300 text-[11px] mt-0.5">completed</p>
                </div>
              </div>

              <div className="float bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl px-6 py-4 w-64 shadow-xl flex items-center gap-3" style={{ animationDelay: "1.5s" }}>
                <div className="w-10 h-10 rounded-full bg-teal-400/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Paystack Secured</p>
                  <p className="text-teal-300 text-xs">Every transaction protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 80L1440 80L1440 30C1200 80 960 10 720 40C480 70 240 0 0 30L0 80Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ─── FEATURES STRIP ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <i className="fa-solid fa-shield-halved text-2xl shrink-0" />, title: "Buyer Protection", desc: "Safe & secured checkout" },
            { icon: <i className="fa-solid fa-rocket text-2xl shrink-0" />, title: "Fast Delivery", desc: "Sellers ship nationwide" },
            { icon: <i className="fa-solid fa-circle-check text-2xl shrink-0" />, title: "Verified Sellers", desc: "Trusted seller profiles" },
            { icon: <i className="fa-solid fa-rotate-left text-2xl shrink-0" />, title: "Easy Returns", desc: "Hassle-free process" },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group">
              <span className="text-2xl shrink-0 text-teal-600">{f.icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{f.title}</p>
                <p className="text-xs text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CATEGORIES ───────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-14 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">
                  <span className="w-4 h-0.5 bg-teal-500 rounded-full" />
                  Categories
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                  Shop by Category
                </h2>
                <p className="text-slate-400 text-sm mt-1">Browse our curated collections</p>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors group"
              >
                View all
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Mobile: horizontal scroll-snap */}
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {categories.map((cat: { _id: string; name: string; slug: string }, idx: number) => {
                const meta = getCategoryMeta(cat.name, idx);
                return (
                  <Link
                    key={cat._id}
                    href={`/products?category=${cat._id}`}
                    className="snap-start shrink-0 w-32 flex flex-col items-center gap-3 group"
                  >
                    <div className={`w-full aspect-square rounded-3xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-105 group-hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
                      {/* Shine */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/15 rounded-t-3xl" />
                      <i className={`fa-solid ${meta.faIcon} text-3xl text-white drop-shadow-md relative z-10`} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 text-center leading-tight group-hover:text-teal-700 transition-colors">{cat.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop: 4-col grid */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-5">
              {categories.map((cat: { _id: string; name: string; slug: string }, idx: number) => {
                const meta = getCategoryMeta(cat.name, idx);
                return (
                  <Link
                    key={cat._id}
                    href={`/products?category=${cat._id}`}
                    className="group relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl bg-white border border-slate-100 hover:border-transparent hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                  >
                    {/* Subtle tinted background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 rounded-3xl`} />

                    {/* Icon container */}
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-2xl" />
                      <i className={`fa-solid ${meta.faIcon} text-2xl text-white drop-shadow relative z-10`} />
                    </div>

                    {/* Name */}
                    <div className="text-center">
                      <p className={`text-sm font-bold text-slate-800 group-hover:${meta.text} transition-colors leading-tight`}>{cat.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Browse →</p>
                    </div>

                    {/* Arrow badge */}
                    <div className={`absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-200 shadow`}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile view-all */}
            <div className="mt-5 text-center sm:hidden">
              <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors shadow-md">
                Browse All Products
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* ─── FEATURED PRODUCTS ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Latest Products</h2>
            <p className="text-slate-400 text-sm mt-0.5">Fresh arrivals from verified sellers</p>
          </div>
          <Link href="/products" className="text-teal-600 hover:text-teal-700 text-sm font-semibold flex items-center gap-1 group">
            See all
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-bag-shopping text-4xl text-teal-300" />
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-1">No products yet</p>
            <p className="text-slate-400 text-sm mb-6">Be the first seller on MarketHub!</p>
            <Link href="/auth/register"
              className="inline-block px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-md">
              Start Selling
            </Link>
          </div>
        )}
      </section>

      {/* ─── SELLER CTA ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 py-20">
        {/* Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-teal-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 mb-4">
                <i className="fa-solid fa-rocket" /> For Sellers
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
                Turn your inventory<br />into income, today.
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                Join thousands of sellers reaching buyers across Nigeria. List your products in minutes and start earning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-500 text-white font-bold rounded-2xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-900/50 hover:-translate-y-0.5">
                  Create Your Store
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="/products"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/15 border border-white/15 transition-all">
                  Browse Market
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "10K+", label: "Products Listed",  faIcon: "fa-box" },
                { value: "2K+",  label: "Active Sellers",   faIcon: "fa-store" },
                { value: "50K+", label: "Happy Buyers",     faIcon: "fa-face-smile" },
                { value: "99%",  label: "Secure Payments",  faIcon: "fa-lock" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                  <i className={`fa-solid ${s.faIcon} text-2xl mb-2 block text-teal-300`} />
                  <p className="text-2xl font-extrabold text-white">{s.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
