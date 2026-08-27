import { notFound } from "next/navigation";
import mongoose from "mongoose";

// Force this page to always be server-rendered on demand.
// Without this, Next.js may try to statically pre-render at build time
// when there is no DB connection, cache a null result, and serve 404 forever.
export const dynamic = "force-dynamic";
export const dynamicParams = true;
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";
import RatingStars from "@/components/shared/RatingStars";
import Badge from "@/components/ui/Badge";
import BuyNowButton from "@/components/product/BuyNowButton";
import ProductReviews from "@/components/product/ProductReviews";
import ImageGallery from "@/components/product/ImageGallery";

import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

async function getProduct(id: string) {
  // Guard: reject non-ObjectId strings immediately (avoids a Mongoose CastError
  // that would be silently caught and returned as null → 404 in production)
  if (!mongoose.isValidObjectId(id)) return null;

  try {
    await connectDB();
    const p = await Product.findById(id)
      .populate("seller", "name storeName avatar storeDescription")
      .populate("category", "name slug")
      .lean();

    if (!p) return null;

    if (p.status !== "active") {
      const session = await auth();
      const isOwner = session && (p.seller as any)?._id?.toString() === session.user.id;
      const isAdmin = session && session.user.role === "admin";
      if (!isOwner && !isAdmin) return null;
    }

    return JSON.parse(JSON.stringify(p));
  } catch (error) {
    // Log the full error so it appears in Vercel's Function Logs
    console.error("[PRODUCT_PAGE_ERROR] id=%s error=%s", id, String(error));
    // Re-throw so the page renders a 500 instead of a misleading 404
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: "Product Not Found | CampusGo" };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusgo.vercel.app";
  const description = (p.description || `${p.title} available on CampusGo Adeleke University Marketplace`).slice(0, 160);
  const productUrl = `${baseUrl}/products/${p._id}`;
  const priceFormatted = `₦${(p.price || 0).toLocaleString()}`;
  const title = `${p.title} (${priceFormatted}) — Adeleke University`;

  const ogImages = p.images?.length
    ? p.images.map((img: string) => ({
        url: img,
        width: 800,
        height: 800,
        alt: p.title || "Product image",
      }))
    : [{ url: `${baseUrl}/main_logo.png`, width: 800, height: 800, alt: p.title || "CampusGo product" }];

  return {
    title,
    description,
    category: p.category?.name || "Campus Products",
    keywords: [
      p.title,
      p.category?.name || "marketplace",
      "Adeleke University",
      "buy on campus",
      "student seller",
      p.condition === "new" ? "brand new" : "used items",
    ].filter(Boolean),
    alternates: {
      canonical: `/products/${p._id}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: productUrl,
      siteName: "CampusGo",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: p.images?.length ? [p.images[0]] : [`${baseUrl}/main_logo.png`],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusgo.vercel.app";
  const pageUrl = `${baseUrl}/products/${product._id}`;
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || "Product",
    image: product.images?.length ? product.images : [`${baseUrl}/main_logo.png`],
    description: product.description || product.title || "",
    sku: String(product._id),
    category: product.category?.name || "Marketplace",
    brand: {
      "@type": "Brand",
      name: product.seller?.storeName || product.seller?.name || "CampusGo",
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "NGN",
      price: String(product.price ?? 0),
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition:
        product.condition === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
      availability:
        (product.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Person",
        name: product.seller?.storeName || product.seller?.name || "Verified Student Seller",
      },
    },
  };
  if (product.numReviews > 0) {
    Object.assign(productSchema, {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number((product.rating ?? 0).toFixed(1)),
        reviewCount: product.numReviews,
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Interactive image gallery — all images, full display, clickable */}
        <ImageGallery
          images={product.images || []}
          title={product.title || "Product"}
        />

        {/* Info panel */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant={product.condition === "new" ? "success" : "neutral"}
            >
              {product.condition === "new" ? "New" : "Used"}
            </Badge>
            {product.category && (
              <span className="text-xs text-gray-400">
                {product.category.name || "Category"}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {product.title || "Untitled Product"}
          </h1>

          {/* Sold by — inline under title */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400">Sold by</span>
            <span className="text-xs font-semibold text-gray-700">
              {product.seller?.storeName || product.seller?.name || "Unknown Seller"}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <RatingStars
              rating={product.rating ?? 0}
              size="md"
              showValue
              count={product.numReviews ?? 0}
            />
            <span className="text-sm text-gray-400">
              {product.sold ?? 0} sold
            </span>
          </div>

          <div className="text-3xl font-bold text-[#111111] mb-6">
            ₦{(product.price ?? 0).toLocaleString()}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {product.description || "No description provided."}
          </p>

          {/* Stock Warning Banners for User UI */}
          {(product.stock ?? 0) === 0 ? (
            <div className="mb-6 px-4 py-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl flex items-center gap-2.5 text-[#991B1B] text-sm font-semibold">
              <i className="fa-solid fa-circle-exclamation text-[#DC2626] text-base" />
              <span>Out of Stock: This item is currently unavailable.</span>
            </div>
          ) : (product.stock ?? 0) <= 3 ? (
            <div className="mb-6 px-4 py-3 bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl flex items-center gap-2.5 text-[#9A3412] text-sm font-semibold animate-pulse">
              <i className="fa-solid fa-triangle-exclamation text-[#EA580C] text-base" />
              <span>
                Hurry! Only {product.stock} left in stock - order soon.
              </span>
            </div>
          ) : null}



          {/* Buy Now & Variant Selection */}
          <BuyNowButton product={product} />


        </div>
      </div>

      {/* Gated reviews */}
      <ProductReviews productId={product._id} />
    </div>
  );
}
