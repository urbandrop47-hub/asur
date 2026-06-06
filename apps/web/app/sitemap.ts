import type { MetadataRoute } from "next";
import type { Product } from "@asur/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://weareasur.in";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchActiveProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as Product[]) ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchActiveProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    // Core
    { url: SITE_URL,                          lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/products`,            lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/collections`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    // Brand
    { url: `${SITE_URL}/about`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/journal`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${SITE_URL}/gift-cards`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    // Support / legal
    { url: `${SITE_URL}/faq`,                 lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/returns`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`,             lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/terms`,               lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
