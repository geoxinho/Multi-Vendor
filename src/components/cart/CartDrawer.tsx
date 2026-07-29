"use client";

import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/25 z-50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <div className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col transition-transform duration-250 border-l border-[#E5E5E5] ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
          <h2 className="text-base font-bold text-[#111111]">
            Cart <span className="text-[#6B6B6B] font-normal">({items.length})</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#F5F5F5] transition-colors">
            <svg className="w-5 h-5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="w-14 h-14 text-[#E5E5E5] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12" />
              </svg>
              <p className="text-[#6B6B6B] font-medium mb-4">Your cart is empty</p>
              <Link href="/products" onClick={onClose}
                className="px-5 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-md hover:bg-[#1D4ED8] transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 p-3 border border-[#E5E5E5] rounded-md">
                <div className="relative w-16 h-16 rounded overflow-hidden shrink-0 bg-[#F5F5F5]">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate">{item.title}</p>
                  <p className="text-sm font-bold text-[#111111] mt-0.5">₦{item.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:border-[#2563EB] transition-colors text-sm"
                    >−</button>
                    <span className="text-sm font-semibold w-5 text-center text-[#111111]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-6 h-6 rounded border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:border-[#2563EB] disabled:opacity-40 transition-colors text-sm"
                    >+</button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="ml-auto text-[#9B9B9B] hover:text-[#DC2626] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E5E5E5] px-5 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B6B6B]">Total</span>
              <span className="text-lg font-bold text-[#111111]">₦{totalPrice().toLocaleString()}</span>
            </div>
            <Link href="/checkout" onClick={onClose}
              className="block w-full py-3 text-center bg-[#2563EB] text-white font-semibold rounded-md hover:bg-[#1D4ED8] transition-colors text-sm">
              Proceed to Checkout
            </Link>
            <button onClick={clearCart}
              className="block w-full py-2 text-center text-sm text-[#9B9B9B] hover:text-[#DC2626] transition-colors">
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
