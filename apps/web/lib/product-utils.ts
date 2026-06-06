import type { Product } from "@asur/types";

export function getVariantPriceRange(product: Product): { min: number; max: number } | null {
  if (product.variants.length === 0) return null;
  const prices = product.variants.map((variant) => variant.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function getLowestVariantPrice(product: Product): number | null {
  return getVariantPriceRange(product)?.min ?? null;
}

export function getHighestVariantPrice(product: Product): number | null {
  return getVariantPriceRange(product)?.max ?? null;
}

export function getTotalStock(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

export function hasVariants(product: Product): boolean {
  return product.variants.length > 0;
}
