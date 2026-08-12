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
      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${
        wishlisted
          ? "border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]"
          : "border-[#E5E5E5] bg-white text-[#9B9B9B] hover:border-[#DC2626] hover:text-[#DC2626]"
      } ${loading ? "opacity-50" : ""}`}
    >
      <i className={`${wishlisted ? "fa-solid" : "fa-regular"} fa-heart text-base`} />
    </button>
  );
}

