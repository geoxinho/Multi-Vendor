"use client";

import { useCartStore } from "@/store/cartStore";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProductSummary } from "@/types";

export default function BuyNowButton({ product }: { product: ProductSummary }) {
  const { data: session } = useSession();
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [variantError, setVariantError] = useState<string>("");
  const router = useRouter();

  const isOwnProduct = session?.user?.id === product.seller._id;
  const hasSizes = (product.variants?.sizes?.length ?? 0) > 0;
  const hasColors = (product.variants?.colors?.length ?? 0) > 0;

  const handleBuyNow = () => {
    if (isOwnProduct) return;

    if (hasSizes && !selectedSize) {
      setVariantError("Please select a size before purchasing.");
      return;
    }
    if (hasColors && !selectedColor) {
      setVariantError("Please select a colour before purchasing.");
      return;
    }
    setVariantError("");

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
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
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

  const KNOWN_CSS_COLORS = new Set([
    "black","white","red","blue","green","yellow","orange","purple","pink","gray",
    "grey","brown","navy","beige","ivory","gold","silver","cyan","teal","maroon",
    "lime","indigo","violet","coral","salmon","khaki","turquoise","magenta","olive",
    "charcoal","crimson",
  ]);

  return (
    <div className="flex flex-col items-stretch w-full">
      {isOwnProduct && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-900 text-sm font-semibold">
          <i className="fa-solid fa-circle-exclamation text-amber-600 text-base" />
          <span>This is your own product. You cannot purchase products you have listed.</span>
        </div>
      )}

      {/* SIZE SELECTOR */}
      {!isOwnProduct && hasSizes && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Size
            {selectedSize && (
              <span className="normal-case text-[#A4860E] font-bold ml-1">— {selectedSize}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants!.sizes.map((s) => {
              const active = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSelectedSize(s); setVariantError(""); }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-bold border transition-all duration-150 ${
                    active
                      ? "bg-[#A4860E] text-white border-[#8a6f0b] shadow-md scale-105"
                      : "bg-white text-gray-700 border-gray-200 hover:border-[#A4860E] hover:text-[#A4860E]"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* COLOUR SELECTOR */}
      {!isOwnProduct && hasColors && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Colour
            {selectedColor && (
              <span className="normal-case text-[#A4860E] font-bold ml-1">— {selectedColor}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants!.colors.map((c) => {
              const active = selectedColor === c;
              const cssColor = c.toLowerCase().replace(/\s+/g, "");
              const hasColorDot = KNOWN_CSS_COLORS.has(cssColor);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setSelectedColor(c); setVariantError(""); }}
                  title={c}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                    active
                      ? "border-[#A4860E] ring-2 ring-[#A4860E]/30 shadow-md scale-105 bg-[#fdf8e8]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#A4860E] hover:text-[#A4860E]"
                  }`}
                >
                  {hasColorDot && (
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0"
                      style={{ backgroundColor: cssColor }}
                    />
                  )}
                  <span className={active ? "text-[#A4860E]" : ""}>{c}</span>
                  {active && <i className="fa-solid fa-check text-[10px] text-[#A4860E]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VARIANT VALIDATION ERROR */}
      {variantError && (
        <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm font-medium">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-sm" />
          {variantError}
        </div>
      )}

      {/* STOCK + QTY ROW */}
      {!isOwnProduct && (
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
              >-</button>
              <span className="px-2 py-0 font-semibold text-[#111111] min-w-[2rem] text-center text-xs h-full flex items-center justify-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-2 py-0 text-[#111111] hover:bg-[#F5F5F5] transition-colors font-bold cursor-pointer h-full flex items-center text-xs"
              >+</button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={isOwnProduct}
        className={`w-full py-3 px-6 rounded-md font-bold text-white transition-colors flex items-center justify-center gap-2 text-sm shadow-sm ${
          isOwnProduct
            ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            : "bg-[#A4860E] hover:bg-[#8a6f0b] cursor-pointer shadow-[#A4860E]/10"
        }`}
      >
        <i className="fa-solid fa-bolt" />
        <span>{isOwnProduct ? "Cannot Purchase Own Product" : "Buy Now"}</span>
      </button>
    </div>
  );
}
