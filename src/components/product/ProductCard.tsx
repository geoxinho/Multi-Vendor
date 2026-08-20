"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useSession } from "next-auth/react";
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

export default function ProductCard({ product, priority = false, wishlisted: initialWishlisted = false, onWishlistChange }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { increment, decrement } = useWishlistStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => { setWishlisted(initialWishlisted); }, [initialWishlisted]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.images[0] ?? "/placeholder.png",
      condition: product.condition,
      sellerId: product.seller?._id || "",
      quantity: 1,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { router.push("/auth/login"); return; }
    if (session.user.role !== "buyer") return;

    setWishlistLoading(true);
    if (wishlisted) {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });
      setWishlisted(false);
      decrement();
      onWishlistChange?.(product._id, false);
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });
      setWishlisted(true);
      increment();
      onWishlistChange?.(product._id, true);
    }
    setWishlistLoading(false);
  };

  const isBuyer = session?.user?.role === "buyer" || !session;

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

          {/* Wishlist button appearing with elegant slide/fade overlay on hover */}
          {isBuyer && (
            <div className="absolute top-3 right-3 z-10 md:opacity-0 md:translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-150 ${
                  wishlisted
                    ? "bg-[#DC2626] border-[#DC2626] text-white shadow-sm"
                    : "bg-white border-[#E5E5E5] text-[#9B9B9B] hover:border-[#DC2626] hover:text-[#DC2626] shadow-sm"
                } ${wishlistLoading ? "opacity-50 cursor-wait" : ""}`}
              >
                <i className={`${wishlisted ? "fa-solid" : "fa-regular"} fa-heart text-xs`} />
              </button>
            </div>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <span className="text-[#6B6B6B] font-bold text-xs tracking-wider uppercase">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[11px] font-semibold text-[#9B9B9B] uppercase tracking-wider mb-1 truncate">
            {product.seller?.storeName || product.seller?.name}
          </p>
          <h3 className="text-sm font-bold text-[#111111] line-clamp-2 mb-2 group-hover:text-[#A4860E] transition-colors leading-snug flex-1">
            {product.title}
          </h3>

          <div className="flex items-center gap-1.5 mb-3.5">
            <RatingStars rating={product.rating} size="sm" />
            <span className="text-xs text-[#9B9B9B] font-medium">({product.numReviews})</span>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#E5E5E5]/40">
            <span className="text-base font-extrabold text-[#111111]">
              ₦{product.price.toLocaleString()}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || session?.user?.id === product.seller?._id}
              className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all duration-150 shadow-sm ${
                session?.user?.id === product.seller?._id
                  ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : added
                  ? "bg-[#F0FDF4] text-[#A4860E] border border-[#A4860E]"
                  : "bg-[#A4860E] text-white hover:bg-[#8a6f0b]"
              } disabled:opacity-40`}
            >
              {session?.user?.id === product.seller?._id ? "Mine" : added ? "✓ Added" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
