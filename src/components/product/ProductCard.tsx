"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useRouter } from "next/navigation";
import RatingStars from "@/components/shared/RatingStars";
import Badge from "@/components/ui/Badge";
import { ProductSummary } from "@/types";
import { useState, useEffect } from "react";

interface ProductCardProps {
  product: ProductSummary;
  priority?: boolean;
  wishlisted?: boolean;
  onWishlistChange?: (productId: string, newState: boolean) => void;
}

export default function ProductCard({
  product,
  priority = false,
  wishlisted: initialWishlisted = false,
  onWishlistChange,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { increment, decrement } = useWishlistStore();
  const router = useRouter();

  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    setWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const sellerIdStr = (product.seller?._id || (typeof product.seller === "string" ? product.seller : ""))?.toString();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] ?? "/placeholder.png",
      condition: product.condition,
      sellerId: sellerIdStr,
      quantity: 1,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setWishlistLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });

      if (res.status === 401) {
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (res.ok) {
        if (wishlisted) {
          setWishlisted(false);
          decrement();
          onWishlistChange?.(product._id, false);
        } else {
          setWishlisted(true);
          increment();
          onWishlistChange?.(product._id, true);
        }
      }
    } catch (err) {
      console.error("[WISHLIST_TOGGLE_ERROR]", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Link href={`/products/${product._id}`} className="group block h-full">
      <div className="bg-white border border-[#E5E5E5]/60 rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        {/* Image Wrapper */}
        <div className="relative aspect-square bg-[#F5F5F5] overflow-hidden shrink-0">
          <Image
            src={product.images[0] ?? "/placeholder.png"}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
          />

          {/* Condition Badge - Golden/Amber variant for NEW for contrast */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            <Badge variant={product.condition === "new" ? "gold" : "neutral"}>
              {product.condition === "new" ? "New" : "Used"}
            </Badge>
            {product.stock > 0 && product.stock <= 3 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF7ED] text-[#D97706] border border-[#FFEDD5] text-center shadow-sm">
                Only {product.stock} left
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              wishlisted
                ? "bg-white text-red-500 shadow-sm"
                : "bg-white/80 backdrop-blur-xs text-gray-500 hover:text-red-500 hover:bg-white shadow-xs"
            }`}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <i className={`fa-heart text-xs ${wishlisted ? "fa-solid" : "fa-regular"}`} />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="p-3.5 flex flex-col flex-1">
          {/* Category */}
          {product.category && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A4860E] mb-1 truncate">
              {product.category.name}
            </span>
          )}

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-[#A4860E] transition-colors leading-snug">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <RatingStars rating={product.rating} size="sm" />
            <span className="text-[10px] text-gray-500 font-medium">
              ({product.numReviews})
            </span>
          </div>

          {/* Price & Action CTA */}
          <div className="mt-auto pt-3 flex flex-col gap-2.5 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-base text-[#111111]">
                ₦{product.price.toLocaleString()}
              </span>
              {product.stock === 0 && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Prominent CTA Button with Cart Icon */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                product.stock === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : added
                  ? "bg-[#F0FDF4] text-[#8a6f0b] border border-[#BBF7D0]"
                  : "bg-[#A4860E] hover:bg-[#8a6f0b] active:scale-[0.98] text-white cursor-pointer hover:shadow-sm"
              }`}
              title={product.stock === 0 ? "Out of stock" : "Add to Cart"}
            >
              {added ? (
                <>
                  <i className="fa-solid fa-check text-xs" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cart-shopping text-xs" />
                  <span>{product.stock === 0 ? "Out of Stock" : "Add to Cart"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
