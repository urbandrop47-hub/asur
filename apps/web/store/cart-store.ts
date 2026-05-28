"use client";

import { create } from "zustand";
import type { CartItem } from "@asur/types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantSku: string) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [
    { productId: "prd_ember", variantSku: "EMB-M-OBS", quantity: 1, unitPrice: 8900 },
    { productId: "prd_aurora", variantSku: "AUR-L-ASH", quantity: 2, unitPrice: 6400 }
  ],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (variantSku) => set((state) => ({ items: state.items.filter((item) => item.variantSku !== variantSku) })),
  clear: () => set({ items: [] }),
  subtotal: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}));
