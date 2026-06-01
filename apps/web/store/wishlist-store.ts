"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@asur/types";

export type WishlistLineItem = {
  productId: string;
  productTitle: string;
  productSlug: string;
  imageUrl?: string;
  price: number;
  addedAt: string;
};

type WishlistState = {
  items: WishlistLineItem[];
  // ID queued to add after the user signs in
  pendingProductId: string | null;
  add: (item: WishlistLineItem) => void;
  remove: (productId: string) => void;
  setAll: (items: WishlistLineItem[]) => void;
  isWishlisted: (productId: string) => boolean;
  setPendingProductId: (id: string | null) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      pendingProductId: null,

      add: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state;
          return { items: [item, ...state.items] };
        }),

      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      setAll: (items) => set({ items }),

      isWishlisted: (productId) => get().items.some((i) => i.productId === productId),

      setPendingProductId: (id) => set({ pendingProductId: id })
    }),
    {
      name: "asur-wishlist",
      partialize: (state) => ({ items: state.items, pendingProductId: state.pendingProductId })
    }
  )
);

/** Build a WishlistLineItem from a Product (used by HeartButton and wishlist page). */
export function productToWishlistItem(product: Product): WishlistLineItem {
  const lowestPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : 0;
  return {
    productId: product.id,
    productTitle: product.title,
    productSlug: product.slug,
    imageUrl: product.media?.[0]?.url,
    price: lowestPrice,
    addedAt: new Date().toISOString()
  };
}
