"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@asur/types";
import { track } from "../lib/analytics";

/** Extended cart line: CartItem + display fields stored at add-time so the cart
 *  page never needs to re-fetch product data. */
export type CartLineItem = CartItem & {
  productTitle: string;
  productSlug: string;
  size: string;
  color: string;
};

type CartState = {
  items: CartLineItem[];
  addItem: (item: CartLineItem) => void;
  updateQuantity: (variantSku: string, quantity: number) => void;
  removeItem: (variantSku: string) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (incoming) => {
        track("add_to_cart", {
          variantSku: incoming.variantSku,
          productTitle: incoming.productTitle,
          quantity: incoming.quantity,
          unitPrice: incoming.unitPrice
        });
        set((state) => {
          const existing = state.items.find((i) => i.variantSku === incoming.variantSku);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantSku === incoming.variantSku
                  ? { ...i, quantity: i.quantity + incoming.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, incoming] };
        });
      },

      updateQuantity: (variantSku, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantSku !== variantSku)
              : state.items.map((i) =>
                  i.variantSku === variantSku ? { ...i, quantity } : i
                ),
        })),

      removeItem: (variantSku) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantSku !== variantSku),
        })),

      clear: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    {
      name: "asur-cart",
      // Only persist the items array — computed values are derived on read
      partialize: (state) => ({ items: state.items }),
    }
  )
);
