"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/store/wishlistStore";
import ProductCard from "./ProductCard";
import { ProductSummary } from "@/types";

interface ProductGridProps {
  products: ProductSummary[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const { data: session } = useSession();
  const { setCount } = useWishlistStore();
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  // Single fetch for the whole grid — not one per card
  const fetchWishlist = useCallback(async () => {
    if (session?.user?.role !== "buyer") return;
    try {
      const res = await fetch("/api/wishlist");
      const items: { product: { _id: string } }[] = await res.json();
      if (Array.isArray(items)) {
        setCount(items.length);
        setWishlistedIds(new Set(items.map((i) => i.product?._id).filter(Boolean)));
      }
    } catch {}
  }, [session, setCount]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleWishlistChange = (productId: string, newState: boolean) => {
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (newState) next.add(productId); else next.delete(productId);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard
          key={p._id}
          product={p}
          wishlisted={wishlistedIds.has(p._id)}
          onWishlistChange={handleWishlistChange}
        />
      ))}
    </div>
  );
}
