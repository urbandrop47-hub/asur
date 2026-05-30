import { Button, Pill } from "@asur/ui";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";

export function ProductCard({ product }: { product: Product }) {
  const variant = product.variants[0];
  return (
    <article className="product-card">
      <div className="product-image">
        <span>{product.slug}</span>
      </div>
      <div className="body stack">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div>
            <Pill tone="info">{product.category}</Pill>
            <h3 style={{ margin: "0.65rem 0 0.25rem" }}>{product.title}</h3>
            <p className="muted" style={{ margin: 0 }}>{product.description}</p>
          </div>
          <strong>{formatCurrency(variant.price)}</strong>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {variant.size} · {variant.color} · SKU {variant.sku} · {variant.stock} in stock
        </p>
        <div className="actions">
          <Button href="/cart">Add to cart</Button>
          <Button href={`/products/${product.slug}`} variant="ghost">View details</Button>
        </div>
      </div>
    </article>
  );
}
