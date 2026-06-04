import type { Product } from "@asur/types";

const KEY = "asur_recently_viewed";
const MAX = 8;

type StoredItem = { slug: string; title: string; category: string; image?: string; price: number };

function fromProduct(p: Product): StoredItem {
  const minPrice = Math.min(...p.variants.map((v) => v.price));
  return { slug: p.slug, title: p.title, category: p.category, image: p.media[0]?.url, price: minPrice };
}

export function recordView(product: Product): void {
  if (typeof window === "undefined") return;
  try {
    const list = getRecent();
    const filtered = list.filter((i) => i.slug !== product.slug);
    const updated = [fromProduct(product), ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch { /* storage full or unavailable */ }
}

export function getRecent(): StoredItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredItem[]) : [];
  } catch {
    return [];
  }
}

export function clearRecent(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
