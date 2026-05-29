"use client";

import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Shopping Cart <span className="text-gray-400 font-normal text-lg">({items.length} items)</span>
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="w-20 h-20 text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-600 mb-3">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Looks like you haven&apos;t added anything yet.</p>
            <Link href="/products"
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-50">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.productId}`}
                      className="font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.condition}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors font-bold">−</button>
                        <span className="px-3 py-1.5 text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors font-bold">+</button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-green-700">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-gray-300 hover:text-red-400 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={clearCart}
                className="text-sm text-red-400 hover:text-red-600 transition-colors">
                Clear all items
              </button>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-20">
                <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} items)</span>
                    <span>₦{totalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span className="text-green-700">₦{totalPrice().toLocaleString()}</span>
                  </div>
                </div>
                <Link href="/checkout"
                  className="block w-full py-3 text-center bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
                  Proceed to Checkout
                </Link>
                <Link href="/products"
                  className="block w-full mt-3 py-2.5 text-center text-sm text-gray-500 hover:text-green-600 transition-colors">
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
