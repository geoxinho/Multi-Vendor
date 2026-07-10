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
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { increment, decrement, setCount } = useWishlistStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Hydrate wishlist state for this product
  useEffect(() => {
    if (session?.user?.role !== "buyer") return;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((items: { product: { _id: string } }[]) => {
        if (Array.isArray(items)) {
          setCount(items.length);
          setWishlisted(items.some((i) => i.product?._id === product._id));
        }
      })
      .catch(() => {});
  }, [session, product._id, setCount]);

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
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });
      setWishlisted(true);
      increment();
    }
    setWishlistLoading(false);
  };

  const isBuyer = session?.user?.role === "buyer" || !session;

  return (
    <Link href={`/products/${product._id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={product.images[0] ?? "/placeholder.png"}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
          />

          {/* Condition badge — top left */}
          <div className="absolute top-2 left-2">
            <Badge variant={product.condition === "new" ? "success" : "gold"}>
              {product.condition === "new" ? "New" : "Used"}
            </Badge>
          </div>

          {/* Wishlist button — top right, buyers only */}
          {isBuyer && (
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200
                ${wishlisted
                  ? "bg-red-500 text-white scale-110"
                  : "bg-white/90 text-gray-400 hover:bg-white hover:text-red-500 hover:scale-110"
                }
                ${wishlistLoading ? "opacity-60 cursor-wait" : ""}
              `}
            >
              <svg
                className="w-4 h-4"
                fill={wishlisted ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-400 mb-1 truncate">
            {product.seller?.storeName || product.seller?.name}
          </p>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-green-600 transition-colors">
            {product.title}
          </h3>

          <div className="flex items-center gap-1 mb-3">
            <RatingStars rating={product.rating} size="sm" />
            <span className="text-xs text-gray-400">({product.numReviews})</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-green-700">
              ₦{product.price.toLocaleString()}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                added
                  ? "bg-green-100 text-green-700"
                  : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {added ? <><i className="fa-solid fa-check" /> Added</> : "Add"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
