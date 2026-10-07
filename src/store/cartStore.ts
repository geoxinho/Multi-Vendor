"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (item) => {
        const itemStock =
          typeof item.stock === "number" && !isNaN(item.stock) && item.stock > 0
            ? item.stock
            : 999;
        const itemQty =
          typeof item.quantity === "number" && !isNaN(item.quantity) && item.quantity > 0
            ? item.quantity
            : 1;

        const existing = get().items.find(
          (i) =>
            i.productId === item.productId &&
            (i.selectedSize ?? "") === (item.selectedSize ?? "") &&
            (i.selectedColor ?? "") === (item.selectedColor ?? "")
        );

        if (existing) {
          set((state) => ({
            isOpen: true,
            items: state.items.map((i) =>
              i.productId === item.productId &&
              (i.selectedSize ?? "") === (item.selectedSize ?? "") &&
              (i.selectedColor ?? "") === (item.selectedColor ?? "")
                ? {
                    ...i,
                    quantity: Math.min(i.quantity + itemQty, itemStock),
                    stock: itemStock,
                  }
                : i
            ),
          }));
        } else {
          set((state) => ({
            isOpen: true,
            items: [
              ...state.items,
              { ...item, quantity: itemQty, stock: itemStock },
            ],
          }));
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId === productId) {
              const stock = typeof i.stock === "number" && !isNaN(i.stock) && i.stock > 0 ? i.stock : 999;
              return { ...i, quantity: Math.min(quantity, stock) };
            }
            return i;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + (typeof i.quantity === "number" && !isNaN(i.quantity) ? i.quantity : 0), 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, i) =>
            sum +
            (typeof i.price === "number" && !isNaN(i.price) ? i.price : 0) *
              (typeof i.quantity === "number" && !isNaN(i.quantity) ? i.quantity : 1),
          0
        ),
    }),
    {
      name: "marketplace-cart",
      // Don't persist isOpen in localStorage
      partialize: (state) => ({ items: state.items }),
    }
  )
);
