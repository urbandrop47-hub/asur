import type { Metadata } from "next";
import ProductsClient from "./products-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://asur.in";

export const metadata: Metadata = {
  title: "Shop All — ASUR",
  description: "Browse the full ASUR collection. Premium Indian streetwear — single price, no restock, no apology.",
  alternates: {
    canonical: `${SITE_URL}/products`,
    languages: { "en-IN": `${SITE_URL}/products` },
  },
  openGraph: {
    title: "Shop All — ASUR",
    description: "Browse the full ASUR collection. Premium Indian streetwear.",
    url: `${SITE_URL}/products`,
    siteName: "ASUR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Shop All — ASUR",
    description: "Browse the full ASUR collection.",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
