import { notFound } from "next/navigation";
import mongoose from "mongoose";

// Force this page to always be server-rendered on demand.
// Without this, Next.js may try to statically pre-render at build time
// when there is no DB connection, cache a null result, and serve 404 forever.
export const dynamic = "force-dynamic";
export const dynamicParams = true;
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
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
    return p ? JSON.parse(JSON.stringify(p)) : null;
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
  if (!p) return { title: "Product Not Found" };

  const description = (p.description || "").slice(0, 155);
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://closevendors.vercel.app"}/products/${p._id}`;

  return {
    title: p.title || "Product Details",
    description,
    openGraph: {
      title: p.title || "Product Details",
      description,
      type: "website",
      url: productUrl,
      images: p.images?.length
        ? p.images.map((image: string) => ({
            url: image,
            alt: p.title || "Product",
          }))
        : [{ url: "/favicon.ico", alt: p.title || "Product" }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title || "Product Details",
      description,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://closevendors.vercel.app"}/products/${product._id}`;
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || "Product",
    image: product.images?.length ? product.images : ["/favicon.ico"],
    description: product.description || "",
    sku: String(product._id),
    brand: {
      "@type": "Brand",
      name: product.category?.name || "MarketHub",
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "NGN",
      price: String(product.price ?? 0),
      itemCondition:
        product.condition === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
      availability:
        (product.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
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

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {product.title || "Untitled Product"}
          </h1>

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

          <div className="flex items-center gap-3 mb-6">
            <span
              className={`text-sm font-medium ${(product.stock ?? 0) > 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}
            >
              {(product.stock ?? 0) > 0 ? (
                <>
                  <i className="fa-solid fa-check" /> {product.stock} in stock
                </>
              ) : (
                "Out of stock"
              )}
            </span>
          </div>

          {/* Buy Now */}
          <BuyNowButton product={product} />

          {/* Seller info */}
          <div className="mt-8 p-4 bg-[#FAFAFA] rounded-md border border-[#E5E5E5]">
            <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2">
              Sold By
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <span className="text-[#2563EB] font-bold">
                  {product.seller?.name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {product.seller?.storeName ||
                    product.seller?.name ||
                    "Unknown Seller"}
                </p>
                {product.seller?.storeDescription && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {product.seller.storeDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gated reviews */}
      <ProductReviews productId={product._id} />
    </div>
  );
}
