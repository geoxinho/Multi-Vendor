"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface WishlistProduct {
  _id: string;
  wishlistId: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  stock: number;
  rating: number;
  numReviews: number;
}

export default function WishlistPage() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchWishlist = useCallback(() => {
    setLoading(true);
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => {
        const items = (d.items ?? []) as Array<{
          _id: string;
          product: Record<string, unknown>;
        }>;
        setProducts(
          items
            .filter((i) => i.product)
            .map((i) => ({
              wishlistId: i._id,
              _id: String(i.product._id),
              title: String(i.product.title),
              price: Number(i.product.price),
              images: (i.product.images as string[]) ?? [],
              condition: String(i.product.condition ?? ""),
              stock: Number(i.product.stock ?? 0),
              rating: Number(i.product.rating ?? 0),
              numReviews: Number(i.product.numReviews ?? 0),
            }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (wishlistId: string) => {
    setRemoving(wishlistId);
    try {
      await fetch(`/api/wishlist/${wishlistId}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.wishlistId !== wishlistId));
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length} saved item{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/products"
          className="text-sm text-[#A4860E] hover:underline font-medium"
        >
          Browse more →
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-heart text-2xl text-red-300" />
          </div>
          <p className="text-gray-500 font-medium mb-2">Your wishlist is empty</p>
          <p className="text-gray-400 text-sm mb-6">
            Save items you love by tapping the{" "}
            <i className="fa-solid fa-heart text-red-400" /> on any product
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-2.5 bg-[#A4860E] text-white font-semibold rounded-xl hover:bg-[#8a7009] transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.wishlistId}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative"
            >
              {/* Remove button */}
              <button
                onClick={() => handleRemove(p.wishlistId)}
                disabled={removing === p.wishlistId}
                title="Remove from wishlist"
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm disabled:opacity-50"
              >
                {removing === p.wishlistId ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                ) : (
                  <i className="fa-solid fa-heart text-xs" />
                )}
              </button>

              <Link href={`/products/${p._id}`} className="block">
                <div className="relative aspect-square bg-gray-50">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <i className="fa-solid fa-image text-4xl" />
                    </div>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                    {p.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A4860E] font-bold">
                      ₦{p.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      <i className="fa-solid fa-star text-yellow-400" />{" "}
                      {p.rating.toFixed(1)} ({p.numReviews})
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]">
                      {p.condition}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
