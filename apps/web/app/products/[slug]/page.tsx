import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Product } from "@asur/types";
import { ProductDetailClient } from "./product-detail-client";
import { ProductJsonLd } from "./json-ld";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://asur.in";

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data as Product) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: "Product not found — ASUR",
      description: "This product doesn't exist or has been removed.",
    };
  }

  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const inStock = product.variants.some((v) => v.stock > 0);
  const ogImage = product.media[0]?.url;
  const canonical = `${SITE_URL}/products/${product.slug}`;

  return {
    title: `${product.title} — ASUR`,
    description: product.description,
    alternates: {
      canonical,
      languages: { "en-IN": canonical },
    },
    openGraph: {
      title: `${product.title} — ASUR`,
      description: product.description,
      url: canonical,
      siteName: "ASUR",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, alt: product.title, width: 800, height: 1000 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} — ASUR`,
      description: product.description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    other: {
      // product-specific Open Graph tags not yet in Next.js Metadata API
      "product:price:amount": String(minPrice),
      "product:price:currency": "INR",
      "product:availability": inStock ? "in stock" : "out of stock",
      "product:brand": "ASUR",
      "product:category": product.category,
    },
  };
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) notFound();

  return (
    <>
      <ProductJsonLd product={product} siteUrl={SITE_URL} />
      <ProductDetailClient product={product} />
    </>
  );
}
