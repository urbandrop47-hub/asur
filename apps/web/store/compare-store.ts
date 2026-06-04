import { create } from "zustand";
import type { Product } from "@asur/types";

type CompareStore = {
  items: Product[];               // up to 3
  add: (p: Product) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
};

export const useCompareStore = create<CompareStore>((set, get) => ({
  items: [],
  add: (p) =>
    set((s) => s.items.length < 3 && !s.items.find((x) => x.slug === p.slug)
      ? { items: [...s.items, p] }
      : s),
  remove: (slug) => set((s) => ({ items: s.items.filter((x) => x.slug !== slug) })),
  clear: () => set({ items: [] }),
  has: (slug) => get().items.some((x) => x.slug === slug)
}));
