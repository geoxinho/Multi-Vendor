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
  const [addedToCart, setAddedToCart] = useState(false);
  const router = useRouter();

  const sellerIdStr = (product.seller?._id || (typeof product.seller === "string" ? product.seller : ""))?.toString();
  const isOwnProduct = Boolean(
    session?.user?.id &&
    sellerIdStr &&
    session.user.id.toString() === sellerIdStr
  );

  const hasSizes = (product.variants?.sizes?.length ?? 0) > 0;
  const hasColors = (product.variants?.colors?.length ?? 0) > 0;

  const validateVariants = (action: string) => {
    if (hasSizes && !selectedSize) {
      setVariantError(`Please select a size before ${action}.`);
      return false;
    }
    if (hasColors && !selectedColor) {
      setVariantError(`Please select a colour before ${action}.`);
      return false;
    }
    setVariantError("");
    return true;
  };

  const handleAddToCart = () => {
    if (isOwnProduct) return;
    if (!validateVariants("adding to cart")) return;

    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] ?? "/placeholder.png",
      condition: product.condition,
      sellerId: sellerIdStr,
      quantity: qty,
      stock: product.stock,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOwnProduct) return;
    if (!validateVariants("purchasing")) return;

    clearCart();
    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] ?? "/placeholder.png",
      condition: product.condition,
      sellerId: sellerIdStr,
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
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants!.sizes.map((size) => {
              const active = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(active ? "" : size);
                    setVariantError("");
                  }}
                  className={`min-w-[2.5rem] h-9 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                    active
                      ? "bg-[#A4860E] text-white border-[#A4860E] shadow-sm"
                      : "bg-white text-gray-700 border-[#E5E5E5] hover:border-[#A4860E]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* COLOR SELECTOR */}
      {!isOwnProduct && hasColors && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Colour {selectedColor && <span className="text-[#111111] font-bold">— {selectedColor}</span>}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {product.variants!.colors.map((color) => {
              const active = selectedColor === color;
              const normalized = color.toLowerCase().trim();
              const isKnownColor = KNOWN_CSS_COLORS.has(normalized);

              if (!isKnownColor) {
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(active ? "" : color);
                      setVariantError("");
                    }}
                    className={`h-9 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                      active
                        ? "bg-[#A4860E] text-white border-[#A4860E] shadow-sm"
                        : "bg-white text-gray-700 border-[#E5E5E5] hover:border-[#A4860E]"
                    }`}
                  >
                    {color}
                  </button>
                );
              }

              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => {
                    setSelectedColor(active ? "" : color);
                    setVariantError("");
                  }}
                  style={{ backgroundColor: normalized }}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    active
                      ? "ring-2 ring-offset-2 ring-[#A4860E] scale-110"
                      : "border border-gray-300 hover:scale-105"
                  } ${normalized === "white" ? "border-gray-300" : ""}`}
                >
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
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="text-sm font-medium text-[#A4860E] flex items-center">
            <i className="fa-solid fa-check mr-1.5" />
            {product.stock} in stock
          </span>
          <span className="text-gray-300 text-xs">|</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Qty:</span>
            <div className="flex items-center border border-[#E5E5E5] rounded-md overflow-hidden bg-white h-8">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-0 text-[#111111] hover:bg-[#F5F5F5] transition-colors font-bold cursor-pointer h-full flex items-center text-sm"
              >-</button>
              <span className="px-2 py-0 font-semibold text-[#111111] min-w-[2.5rem] text-center text-sm h-full flex items-center justify-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-3 py-0 text-[#111111] hover:bg-[#F5F5F5] transition-colors font-bold cursor-pointer h-full flex items-center text-sm"
              >+</button>
            </div>
          </div>
        </div>
      )}

      {/* BUTTON ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOwnProduct}
          className={`flex-1 py-3 px-5 rounded-md font-bold transition-all flex items-center justify-center gap-2 text-sm border shadow-sm ${
            isOwnProduct
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : addedToCart
              ? "bg-[#F0FDF4] text-[#A4860E] border-[#A4860E]"
              : "bg-white hover:bg-amber-50/50 text-[#A4860E] border-[#A4860E] cursor-pointer"
          }`}
        >
          <i className="fa-solid fa-cart-shopping" />
          <span>{addedToCart ? "✓ Added to Cart" : "Add to Cart"}</span>
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOwnProduct}
          className={`flex-1 py-3 px-5 rounded-md font-bold text-white transition-all flex items-center justify-center gap-2 text-sm shadow-sm ${
            isOwnProduct
              ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-[#A4860E] hover:bg-[#8a6f0b] cursor-pointer shadow-[#A4860E]/10"
          }`}
        >
          <i className="fa-solid fa-bolt" />
          <span>{isOwnProduct ? "Cannot Purchase Own Product" : "Buy Now"}</span>
        </button>
      </div>
    </div>
  );
}
