import type { Product } from "@asur/types";

export function ProductJsonLd({ product, siteUrl }: { product: Product; siteUrl: string }) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxPrice = Math.max(...product.variants.map((v) => v.price));
  const inStock = product.variants.some((v) => v.stock > 0);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    url: `${siteUrl}/products/${product.slug}`,
    brand: {
      "@type": "Brand",
      name: "ASUR",
    },
    image: product.media.map((m) => m.url),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: product.variants.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      offers: product.variants.map((v) => ({
        "@type": "Offer",
        priceCurrency: "INR",
        price: v.price,
        sku: v.sku,
        name: `${product.title} — ${v.size} / ${v.color}`,
        availability: v.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "ASUR" },
      })),
    },
    category: product.category,
    ...(product.tags?.length ? { keywords: product.tags.join(", ") } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
