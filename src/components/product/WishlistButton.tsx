"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useWishlistStore } from "@/store/wishlistStore";

export default function WishlistButton({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { increment, decrement, setCount } = useWishlistStore();

  useEffect(() => {
    if (session?.user?.role !== "buyer") return;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((items: { product: { _id: string } }[]) => {
        if (Array.isArray(items)) {
          setCount(items.length);
          setWishlisted(items.some((i) => i.product?._id === productId));
        }
      })
      .catch(() => {});
  }, [session, productId, setCount]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { router.push("/auth/login"); return; }
    if (session.user.role !== "buyer") return;

    setLoading(true);
    if (wishlisted) {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setWishlisted(false);
      decrement();
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setWishlisted(true);
      increment();
    }
    setLoading(false);
  };

  if (session?.user?.role === "seller" || session?.user?.role === "admin") return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
        wishlisted
          ? "border-red-400 bg-red-50 text-red-500"
          : "border-gray-200 bg-white text-gray-400 hover:border-red-300 hover:text-red-400"
      } ${loading ? "opacity-50" : ""}`}
    >
      <svg
        className="w-5 h-5"
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
  );
}
