import type { ReadonlyURLSearchParams } from "next/navigation";

export const PRICE_BOUNDS = { min: 0, max: 5000, step: 100 };

export interface ProductFilters {
  q: string;
  category: string;
  fit: string;
  size: string;
  color: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  sort: "newest" | "price_asc" | "price_desc" | "popularity";
}

export const DEFAULT_FILTERS: ProductFilters = {
  q: "",
  category: "",
  fit: "",
  size: "",
  color: "",
  minPrice: PRICE_BOUNDS.min,
  maxPrice: PRICE_BOUNDS.max,
  inStock: false,
  sort: "newest"
};

export function filtersFromParams(params: ReadonlyURLSearchParams): ProductFilters {
  const sort = params.get("sort");
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    fit: params.get("fit") ?? "",
    size: params.get("size") ?? "",
    color: params.get("color") ?? "",
    minPrice: Number(params.get("minPrice") ?? PRICE_BOUNDS.min),
    maxPrice: Number(params.get("maxPrice") ?? PRICE_BOUNDS.max),
    inStock: params.get("inStock") === "1",
    sort: (["newest", "price_asc", "price_desc", "popularity"].includes(sort ?? "") ? sort : "newest") as ProductFilters["sort"]
  };
}

export function filtersToParams(f: ProductFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  if (f.fit) p.set("fit", f.fit);
  if (f.size) p.set("size", f.size);
  if (f.color) p.set("color", f.color);
  if (f.minPrice > PRICE_BOUNDS.min) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice < PRICE_BOUNDS.max) p.set("maxPrice", String(f.maxPrice));
  if (f.inStock) p.set("inStock", "1");
  if (f.sort !== "newest") p.set("sort", f.sort);
  return p;
}

export function filtersToApiQuery(f: ProductFilters, collection?: string): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  if (f.fit) p.set("fit", f.fit);
  if (f.size) p.set("size", f.size);
  if (f.color) p.set("color", f.color);
  if (f.minPrice > PRICE_BOUNDS.min) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice < PRICE_BOUNDS.max) p.set("maxPrice", String(f.maxPrice));
  if (f.inStock) p.set("inStock", "1");
  if (f.sort) p.set("sort", f.sort);
  if (collection) p.set("collection", collection);
  return p.toString() ? `?${p.toString()}` : "";
}

export function countActiveFilters(f: ProductFilters): number {
  let n = 0;
  if (f.q) n++;
  if (f.category) n++;
  if (f.fit) n++;
  if (f.size) n++;
  if (f.color) n++;
  if (f.inStock) n++;
  if (f.sort !== "newest") n++;
  if (f.minPrice > PRICE_BOUNDS.min || f.maxPrice < PRICE_BOUNDS.max) n++;
  return n;
}

// Returns a human-readable label for each active filter for the chip row
export function activeFilterChips(f: ProductFilters): { key: string; label: string; remove: () => ProductFilters }[] {
  const chips: { key: string; label: string; remove: () => ProductFilters }[] = [];
  if (f.q) chips.push({ key: "q", label: `"${f.q}"`, remove: () => ({ ...f, q: "" }) });
  if (f.category) chips.push({ key: "category", label: f.category, remove: () => ({ ...f, category: "" }) });
  if (f.fit) chips.push({ key: "fit", label: f.fit, remove: () => ({ ...f, fit: "" }) });
  if (f.size) chips.push({ key: "size", label: `Size ${f.size}`, remove: () => ({ ...f, size: "" }) });
  if (f.color) chips.push({ key: "color", label: f.color, remove: () => ({ ...f, color: "" }) });
  if (f.inStock) chips.push({ key: "inStock", label: "In stock", remove: () => ({ ...f, inStock: false }) });
  if (f.sort !== "newest") {
    const labels: Record<string, string> = { price_asc: "Price ↑", price_desc: "Price ↓", popularity: "Popular" };
    chips.push({ key: "sort", label: labels[f.sort] ?? f.sort, remove: () => ({ ...f, sort: "newest" }) });
  }
  if (f.minPrice > PRICE_BOUNDS.min || f.maxPrice < PRICE_BOUNDS.max) {
    chips.push({
      key: "price",
      label: `₹${f.minPrice}–₹${f.maxPrice}${f.maxPrice >= PRICE_BOUNDS.max ? "+" : ""}`,
      remove: () => ({ ...f, minPrice: PRICE_BOUNDS.min, maxPrice: PRICE_BOUNDS.max })
    });
  }
  return chips;
}
