import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import ProductGrid from "@/components/product/ProductGrid";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const HOME_DESCRIPTION =
  "Nigeria's dedicated campus marketplace for Adeleke University students. Buy and sell textbooks, electronics, fashion, food, dorm & hostel essentials with instant 24-hr escrow protection.";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusgo.vercel.app";

export const metadata: Metadata = {
  title: "CampusGo — Adeleke University Campus Marketplace",
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CampusGo — Adeleke University Campus Marketplace",
    description: HOME_DESCRIPTION,
    type: "website",
    siteName: "CampusGo",
    url: SITE_URL,
    images: [
      {
        url: "/main_logo.png",
        width: 1200,
        height: 630,
        alt: "CampusGo homepage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusGo — Adeleke University Campus Marketplace",
    description: HOME_DESCRIPTION,
    images: ["/main_logo.png"],
  },
};

/**
 * Fetch up to 4 random featured products
 */
async function getFeaturedProducts() {
  try {
    await connectDB();
    const randomProducts = await Product.aggregate([
      { $match: { status: "active", stock: { $gt: 0 } } },
      { $sample: { size: 4 } },
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          price: 1,
          images: 1,
          condition: 1,
          rating: 1,
          numReviews: 1,
          stock: 1,
          createdAt: 1,
          "seller._id": 1,
          "seller.name": 1,
          "seller.storeName": 1,
          "category._id": 1,
          "category.name": 1,
          "category.slug": 1,
        },
      },
    ]);

    if (randomProducts && randomProducts.length > 0) {
      return JSON.parse(JSON.stringify(randomProducts));
    }

    // Fallback if aggregate pipeline returned empty
    const fallback = await Product.find({ status: "active", stock: { $gt: 0 } })
      .populate("seller", "name storeName avatar storeDescription")
      .populate("category", "name slug")
      .limit(4)
      .lean();
    return JSON.parse(JSON.stringify(fallback));
  } catch (err) {
    console.error("[GET_FEATURED_PRODUCTS_ERROR]", err);
    return [];
  }
}

/**
 * Fetch latest 8 campus products sorted by -createdAt
 */
async function getLatestProducts() {
  try {
    await connectDB();
    const products = await Product.find({ status: "active", stock: { $gt: 0 } })
      .populate("seller", "name storeName avatar storeDescription")
      .populate("category", "name slug")
      .sort("-createdAt")
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch (err) {
    console.error("[GET_LATEST_PRODUCTS_ERROR]", err);
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

const CAT_STYLING: Record<
  string,
  {
    icon: string;
    bg: string;
    border: string;
    text: string;
    iconBg: string;
  }
> = {
  electronics: {
    icon: "fa-laptop",
    bg: "bg-[#fdf8e8]",
    border: "border-[#e8d48a]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#fdf8e8]",
  },
  fashion: {
    icon: "fa-shirt",
    bg: "bg-[#FFF5F5]",
    border: "border-[#FED7D7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEE2E2]",
  },
  phones: {
    icon: "fa-mobile-screen",
    bg: "bg-[#FFFBEB]",
    border: "border-[#FEF3C7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEF08A]",
  },
  shoes: {
    icon: "fa-shoe-prints",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FFD8A8]",
  },
  books: {
    icon: "fa-book",
    bg: "bg-[#fdf8e8]",
    border: "border-[#e8d48a]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#fdf8e8]",
  },
  beauty: {
    icon: "fa-spray-can-sparkles",
    bg: "bg-[#FFF5F5]",
    border: "border-[#FED7D7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEE2E2]",
  },
  furniture: {
    icon: "fa-couch",
    bg: "bg-[#FFFBEB]",
    border: "border-[#FEF3C7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEF08A]",
  },
  sports: {
    icon: "fa-futbol",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FFD8A8]",
  },
  food: {
    icon: "fa-apple-whole",
    bg: "bg-[#FFF5F5]",
    border: "border-[#FED7D7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEE2E2]",
  },
  gaming: {
    icon: "fa-gamepad",
    bg: "bg-[#FFFBEB]",
    border: "border-[#FEF3C7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEF08A]",
  },
  toys: {
    icon: "fa-child-reaching",
    bg: "bg-[#FFFBEB]",
    border: "border-[#FEF3C7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEF08A]",
  },
  health: {
    icon: "fa-pills",
    bg: "bg-[#fdf8e8]",
    border: "border-[#e8d48a]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#fdf8e8]",
  },
};

const FALLBACK_STYLES = [
  {
    bg: "bg-[#fdf8e8]",
    border: "border-[#e8d48a]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#fdf8e8]",
  },
  {
    bg: "bg-[#FFF5F5]",
    border: "border-[#FED7D7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEE2E2]",
  },
  {
    bg: "bg-[#FFFBEB]",
    border: "border-[#FEF3C7]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FEF08A]",
  },
  {
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]/60",
    text: "text-[#A4860E]",
    iconBg: "bg-[#FFD8A8]",
  },
];

function getCategoryStyle(name: string, index: number) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CAT_STYLING)) {
    if (key.includes(k)) return { ...v };
  }
  const fallback = FALLBACK_STYLES[index % FALLBACK_STYLES.length];
  return {
    icon: "fa-bag-shopping",
    ...fallback,
  };
}

export default async function HomePage() {
  const [featuredProducts, latestProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
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

      {/* ─── 1. HERO SECTION (Campus Trading Theme) ────────────── */}
      <section className="relative border-b border-[#E5E5E5] bg-gradient-to-br from-[#fdf8e8]/20 via-white to-white py-20 lg:py-28 overflow-hidden">
        {/* Background decorative glowing elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-[#A4860E]/5 blur-[120px]" />
          <div className="absolute top-[40%] left-[10%] w-[35vw] h-[35vw] rounded-full bg-[#A4860E]/2 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left — copy */}
            <div className="lg:col-span-7 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#fdf8e8] text-[#A4860E] text-xs font-semibold mb-6 border border-[#e8d48a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A4860E] inline-block animate-pulse" />
                Nigeria&apos;s Student Campus Marketplace
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#111111] leading-[1.15] tracking-tight mb-6">
                Buy & Sell,
                <br />
                <span className="bg-gradient-to-r from-[#A4860E] to-[#b3951f] bg-clip-text text-transparent">
                  Trade on Campus.
                </span>
              </h1>

              <p className="text-[#6B6B6B] text-base md:text-lg leading-relaxed mb-10 max-w-lg">
                The safest way for students to buy and sell textbooks, hostel
                appliances, electronics, and fashion. Trade new or used products
                directly with peers on campus.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-2">
                <Link
                  href="/products"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#A4860E] text-white font-bold rounded-md hover:bg-[#8a6f0b] hover:shadow-lg hover:shadow-[#A4860E]/10 hover:-translate-y-0.5 transition-all duration-300 text-sm"
                >
                  Browse Campus Listings
                  <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right — image illustration of students trading on campus */}
            <div className="hidden lg:block lg:col-span-5 animate-in fade-in slide-in-from-right-6 duration-700">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-[#E5E5E5]/50 bg-white group">
                <Image
                  src="/hero_campus.png"
                  alt="CampusGo student trading illustration"
                  fill
                  className="object-cover group-hover:scale-102 transition-transform duration-700"
                  priority
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. FEATURED PRODUCTS (Random 4 Products Below Hero) ── */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#A4860E] inline-block animate-pulse" />
                <span className="text-[11px] font-extrabold text-[#A4860E] tracking-wider uppercase">
                  Featured Highlights
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#111111] tracking-tight">
                Featured Products
              </h2>
              <p className="text-[#6B6B6B] text-xs mt-1">
                Random student picks and top campus deals
              </p>
            </div>
            <Link
              href="/products"
              className="text-[#A4860E] hover:underline text-sm font-bold flex items-center gap-1.5 shrink-0"
            >
              See all
              <i className="fa-solid fa-arrow-right text-xs" />
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>
      )}

      {/* ─── 3. TRUST/FEATURE STRIP (White Background) ───────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: "fa-shield-halved",
              title: "Buyer Protection",
              desc: "Escrow system until handshake",
              color: "text-[#A4860E] border-[#BBF7D0]/60",
            },
            {
              icon: "fa-handshake",
              title: "Campus Handover",
              desc: "Inspect items before paying",
              color: "text-[#D97706] border-[#FEF3C7]/60",
            },
            {
              icon: "fa-graduation-cap",
              title: "Student Verified",
              desc: "Profiles linked to school email",
              color: "text-[#A4860E]  border-[#BFDBFE]/60",
            },
            {
              icon: "fa-rotate-left",
              title: "Easy Returns",
              desc: "Trade backed by our policy",
              color: "text-[#DB2777]  border-[#FBCFE8]/60",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-[#E5E5E5]/60 p-5 lg:flex items-center justify-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300"
            >
              <span
                className={`w-10 h-10 rounded-lg items-center justify-center ${f.color} text-lg shrink-0`}
              >
                <i
                  className={`fa-solid ${f.icon} justify-center items-center mx-auto`}
                />
              </span>
              <div>
                <p className="text-sm font-bold text-[#111111]">{f.title}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. SHOP BY CATEGORY (Tinted Background) ─────────── */}
      {categories.length > 0 && (
        <section className="py-16 bg-[#FAFAFA] border-y border-[#E5E5E5]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
                Shop by Category
              </h2>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#A4860E] hover:underline"
              >
                View all categories
                <i className="fa-solid fa-chevron-right text-xs" />
              </Link>
            </div>

            {/* Mobile Categories scroll */}
            <div
              className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map(
                (cat: { _id: string; name: string }, idx: number) => {
                  const style = getCategoryStyle(cat.name, idx);
                  return (
                    <Link
                      key={cat._id}
                      href={`/products?category=${cat._id}`}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border ${style.bg} ${style.border} text-xs font-bold ${style.text}`}
                    >
                      <i className={`fa-solid ${style.icon}`} />
                      <span>{cat.name}</span>
                    </Link>
                  );
                },
              )}
            </div>

            {/* Desktop Categories grid */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map(
                (cat: { _id: string; name: string }, idx: number) => {
                  const style = getCategoryStyle(cat.name, idx);
                  return (
                    <Link
                      key={cat._id}
                      href={`/products?category=${cat._id}`}
                      className={`flex items-center gap-3.5 p-3.5 rounded-xl border ${style.bg} ${style.border} hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300`}
                    >
                      <div
                        className={`w-9 h-9 shrink-0 rounded-lg ${style.iconBg} flex items-center justify-center border border-[#E5E5E5]/20`}
                      >
                        <i
                          className={`fa-solid ${style.icon} ${style.text} text-sm`}
                        />
                      </div>
                      <span
                        className={`text-sm font-bold ${style.text} truncate`}
                      >
                        {cat.name}
                      </span>
                    </Link>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── 5. LATEST PRODUCTS (Max 8 Products) ─────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Latest Campus Listings
            </h2>
            <p className="text-[#6B6B6B] text-xs mt-1">
              Fresh additions from student sellers
            </p>
          </div>
          <Link
            href="/products"
            className="text-[#A4860E] hover:underline text-sm font-medium flex items-center gap-1"
          >
            See all products
            <i className="fa-solid fa-chevron-right text-xs" />
          </Link>
        </div>
        {latestProducts.length > 0 ? (
          <ProductGrid products={latestProducts} />
        ) : (
          <div className="text-center py-16 bg-[#FAFAFA] border border-[#E5E5E5]/60 rounded-xl shadow-sm">
            <p className="text-base font-semibold text-[#111111] mb-1">
              No listings yet
            </p>
            <p className="text-[#6B6B6B] text-sm mb-6">
              Check back soon for new campus items!
            </p>
            <Link
              href="/products"
              className="inline-block px-5 py-2.5 bg-[#A4860E] text-white font-bold rounded-md hover:bg-[#8a6f0b] transition-colors text-sm"
            >
              Browse Categories
            </Link>
          </div>
        )}
      </section>

      {/* ─── 6. FOR SELLERS CTA (Student Focus) ────────────────── */}
      <section className="bg-[#FAFAFA] border-t border-[#E5E5E5]/60 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#111111] text-white rounded-2xl p-8 lg:p-12 shadow-xl relative overflow-hidden">
            {/* Background glowing blur blob */}
            <div className="absolute top-0 right-0 w-[30vw] h-[30vw] rounded-full bg-[#A4860E]/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[20vw] h-[20vw] rounded-full bg-[#A4860E]/5 blur-[80px] pointer-events-none" />

            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 text-white text-xs font-semibold border border-white/20 mb-4">
                  <i className="fa-solid fa-graduation-cap text-[#A4860E]" />{" "}
                  Start Selling
                </span>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
                  Turn your old hostel items into cash.
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  Clear out textbooks, notes, hostel items, clothes, or
                  appliances you don&apos;t need anymore. List them in minutes
                  and sell to fellow students on campus.
                </p>
                <div className="flex flex-col sm:flex-row gap-3.5">
                  <Link
                    href="/auth/register?role=seller"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#A4860E] text-white font-bold rounded-md hover:bg-[#8a6f0b] transition-colors text-sm shadow-sm"
                  >
                    Start Selling on Campus
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-white/5 text-white font-semibold rounded-md hover:bg-white/10 border border-white/15 transition-all text-sm"
                  >
                    Browse Listings
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "10K+", label: "Products Traded", faIcon: "fa-box" },
                  {
                    value: "2K+",
                    label: "Student Sellers",
                    faIcon: "fa-graduation-cap",
                  },
                  {
                    value: "50K+",
                    label: "Successful Swaps",
                    faIcon: "fa-handshake",
                  },
                  { value: "100%", label: "Secure Escrow", faIcon: "fa-lock" },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors duration-300"
                  >
                    <i
                      className={`fa-solid ${s.faIcon} text-lg mb-2 block text-[#A4860E]`}
                    />
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
