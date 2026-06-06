import type { Product } from "@asur/types";
import { getVariantPriceRange, getTotalStock } from "../../../lib/product-utils";

type Aggregate = { averageRating: number; count: number } | null;

export function ProductJsonLd({ product, siteUrl, aggregate }: { product: Product; siteUrl: string; aggregate?: Aggregate }) {
  const priceRange = getVariantPriceRange(product);
  const totalStock = getTotalStock(product);
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
    ...(priceRange
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: priceRange.min,
            highPrice: priceRange.max,
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
        }
      : {
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            availability: totalStock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: "ASUR" },
          },
        }),
    category: product.category,
    ...(product.tags?.length ? { keywords: product.tags.join(", ") } : {}),
    ...(aggregate && aggregate.count > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: aggregate.averageRating.toFixed(1),
        reviewCount: aggregate.count,
        bestRating: "5",
        worstRating: "1",
      }
    } : {}),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Products", item: `${siteUrl}/products` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${siteUrl}/products/${product.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}
