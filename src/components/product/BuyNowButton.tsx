"use client";

import { useCartStore } from "@/store/cartStore";
import { useState } from "react";
import { ProductSummary } from "@/types";
import { useRouter } from "next/navigation";

export default function BuyNowButton({ product }: { product: ProductSummary }) {
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [qty, setQty] = useState(1);
  const router = useRouter();

  const handleBuyNow = () => {
    clearCart();
    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.images[0] ?? "/placeholder.png",
      condition: product.condition,
      sellerId: product.seller._id,
      quantity: qty,
      stock: product.stock,
    });
    router.push("/checkout");
  };

  if (product.stock === 0) {
    return (
      <div className="flex items-center justify-center py-3 px-6 rounded-md bg-[#FAFAFA] text-[#9B9B9B] border border-[#E5E5E5] font-semibold w-full text-sm">
        Out of Stock
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <div className="flex items-center justify-between border border-[#E5E5E5] rounded-md overflow-hidden shrink-0 bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-4 py-2.5 text-[#111111] hover:bg-[#F5F5F5] transition-colors font-bold cursor-pointer"
        >−</button>
        <span className="px-4 py-2.5 font-semibold text-[#111111] min-w-[3rem] text-center text-sm">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="px-4 py-2.5 text-[#111111] hover:bg-[#F5F5F5] transition-colors font-bold cursor-pointer"
        >+</button>
      </div>
      <button
        type="button"
        onClick={handleBuyNow}
        className="flex-1 py-3 px-6 rounded-md font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
      >
        <i className="fa-solid fa-bolt" />
        <span>Buy Now</span>
      </button>
    </div>
  );
}

