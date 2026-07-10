import { notFound } from "next/navigation";
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
  await connectDB();
  try {
    const p = await Product.findById(id)
      .populate("seller", "name storeName avatar storeDescription")
      .populate("category", "name slug")
      .lean();
    return p ? JSON.parse(JSON.stringify(p)) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: "Product Not Found" };

  const description = p.description.slice(0, 155);
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://closevenders.vercel.app"}/products/${p._id}`;

  return {
    title: p.title,
    description,
    openGraph: {
      title: p.title,
      description,
      type: "website",
      url: productUrl,
      images: p.images?.length
        ? p.images.map((image: string) => ({ url: image, alt: p.title }))
        : [{ url: "/favicon.ico", alt: p.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://closevenders.vercel.app"}/products/${product._id}`;
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images?.length ? product.images : ["/favicon.ico"],
    description: product.description,
    sku: String(product._id),
    brand: {
      "@type": "Brand",
      name: product.category?.name || "MarketHub",
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "NGN",
      price: String(product.price),
      itemCondition:
        product.condition === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
  if (product.numReviews > 0) {
    Object.assign(productSchema, {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(product.rating.toFixed(1)),
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
        <ImageGallery images={product.images} title={product.title} />

        {/* Info panel */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={product.condition === "new" ? "success" : "gold"}>
              {product.condition === "new" ? "New" : "Used"}
            </Badge>
            {product.category && (
              <span className="text-xs text-gray-400">
                {product.category.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {product.title}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            <RatingStars
              rating={product.rating}
              size="md"
              showValue
              count={product.numReviews}
            />
            <span className="text-sm text-gray-400">{product.sold} sold</span>
          </div>

          <div className="text-3xl font-extrabold text-green-700 mb-6">
            ₦{product.price.toLocaleString()}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {product.description}
          </p>

          <div className="flex items-center gap-3 mb-6">
            <span
              className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}
            >
              {product.stock > 0 ? (
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
          <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sold By
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <span className="text-green-700 font-bold">
                  {product.seller?.name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {product.seller?.storeName || product.seller?.name}
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
