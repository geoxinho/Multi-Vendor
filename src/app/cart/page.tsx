"use client";

import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-[#111111] mb-2">
          Shopping Cart
        </h1>
        <p className="text-sm text-[#9B9B9B] mb-8">{items.length} item{items.length !== 1 ? "s" : ""}</p>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="w-16 h-16 text-[#E5E5E5] mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12" />
            </svg>
            <h2 className="text-lg font-semibold text-[#111111] mb-2">Your cart is empty</h2>
            <p className="text-[#6B6B6B] mb-8 text-sm">Looks like you haven&apos;t added anything yet.</p>
            <Link href="/products"
              className="px-6 py-2.5 bg-[#A4860E] text-white font-semibold rounded-md hover:bg-[#8a6f0b] transition-colors text-sm">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="bg-white border border-[#E5E5E5] rounded-md p-4 flex gap-4">
                  <div className="relative w-20 h-20 rounded overflow-hidden shrink-0 bg-[#F5F5F5]">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.productId}`}
                      className="font-medium text-[#111111] hover:text-[#A4860E] transition-colors line-clamp-2 text-sm">
                      {item.title}
                    </Link>
                    <p className="text-xs text-[#9B9B9B] mt-0.5 capitalize">{item.condition}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#E5E5E5] rounded-md overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-3 py-1.5 text-[#111111] hover:bg-[#F5F5F5] transition-colors text-sm font-bold">−</button>
                        <span className="px-3 py-1.5 text-sm font-semibold text-[#111111] border-x border-[#E5E5E5]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="px-3 py-1.5 text-[#111111] hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors text-sm font-bold">+</button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-[#111111] text-sm">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <button onClick={() => removeItem(item.productId)}
                          className="text-[#D0D0D0] hover:text-[#DC2626] transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={clearCart} className="text-xs text-[#9B9B9B] hover:text-[#DC2626] transition-colors mt-2">
                Clear all items
              </button>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-md p-6 sticky top-20">
                <h2 className="font-bold text-[#111111] mb-4 text-sm uppercase tracking-wide">Order Summary</h2>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="text-[#111111]">₦{totalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Delivery</span>
                    <span className="text-[#A4860E] font-medium">Free</span>
                  </div>
                  <div className="border-t border-[#E5E5E5] pt-3 flex justify-between font-bold text-[#111111]">
                    <span>Total</span>
                    <span>₦{totalPrice().toLocaleString()}</span>
                  </div>
                </div>
                <Link href="/checkout"
                  className="block w-full py-3 text-center bg-[#A4860E] text-white font-semibold rounded-md hover:bg-[#8a6f0b] transition-colors text-sm">
                  Proceed to Checkout
                </Link>
                <Link href="/products"
                  className="block w-full mt-3 py-2 text-center text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
