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
    <div className="flex flex-col items-stretch w-full">
      {/* Stock and small Quantity selector inline */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm font-medium text-[#A4860E] flex items-center">
          <i className="fa-solid fa-check mr-1.5" />
          {product.stock} in stock
        </span>
        <span className="text-gray-300 text-xs">|</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Qty:</span>
          <div className="flex items-center border border-[#E5E5E5] rounded-md overflow-hidden bg-white h-7">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-2 py-0 text-[#111111] hover:bg-[#F5F5F5] transition-colors font-bold cursor-pointer h-full flex items-center text-xs"
            >−</button>
            <span className="px-2 py-0 font-semibold text-[#111111] min-w-[2rem] text-center text-xs h-full flex items-center justify-center">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              className="px-2 py-0 text-[#111111] hover:bg-[#F5F5F5] transition-colors font-bold cursor-pointer h-full flex items-center text-xs"
            >+</button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleBuyNow}
        className="w-full py-3 px-6 rounded-md font-bold bg-[#A4860E] hover:bg-[#8a6f0b] text-white transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm shadow-[#A4860E]/10"
      >
        <i className="fa-solid fa-bolt" />
        <span>Buy Now</span>
      </button>
    </div>
  );
}

