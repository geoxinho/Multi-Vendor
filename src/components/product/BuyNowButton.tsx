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
    // Clear the cart and add just this item for an instant direct checkout
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
      <div className="flex items-center justify-center py-3 px-6 rounded-xl bg-gray-100 text-gray-400 font-semibold w-full">
        Out of Stock
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <div className="flex items-center justify-between border border-gray-200 rounded-xl overflow-hidden shrink-0 bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-bold cursor-pointer"
        >−</button>
        <span className="px-4 py-3 font-semibold text-gray-900 min-w-[3rem] text-center">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-bold cursor-pointer"
        >+</button>
      </div>
      <button
        type="button"
        onClick={handleBuyNow}
        className="flex-1 py-3.5 px-6 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white transition-all duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <i className="fa-solid fa-bolt" />
        <span>Buy Now</span>
      </button>
    </div>
  );
}
