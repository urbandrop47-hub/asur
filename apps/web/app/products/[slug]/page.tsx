import { notFound } from "next/navigation";
import Link from "next/link";
import { featuredProducts } from "../../../lib/catalog";
import { AppShell, Button, Pill } from "@asur/ui";
import { formatCurrency } from "@asur/utils";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = featuredProducts.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const variant = product.variants[0];

  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
        </div>
        <Link className="badge" href="/products">
          Back to products
        </Link>
      </div>

      <AppShell title="Product detail" subtitle="A detail route gives the storefront room for richer media, sizing, and cross-sell logic later.">
        <div className="actions">
          <Pill tone="info">{product.category}</Pill>
          <Pill tone="success">{variant.size}</Pill>
          <Pill tone="warning">{variant.color}</Pill>
        </div>
      </AppShell>

      <div className="grid-2">
        <article className="summary-card">
          <div className="panel stack">
            <strong>Variant data</strong>
            <p>SKU: {variant.sku}</p>
            <p>Stock: {variant.stock}</p>
            <p>Price: {formatCurrency(variant.price)}</p>
          </div>
        </article>
        <article className="summary-card">
          <div className="panel stack">
            <strong>What comes next</strong>
            <p>Product imagery from Cloudflare R2, variant pickers, and add-to-cart actions can all layer onto this route later.</p>
            <Button href="/cart">Add to cart</Button>
          </div>
        </article>
      </div>
    </div>
  );
}
