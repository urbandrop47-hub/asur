import Link from "next/link";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";

export function ProductCard({ product }: { product: Product }) {
  const lowestPrice = product.variants.length > 0 ? Math.min(...product.variants.map((v) => v.price)) : 0;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} style={{ display: "block", textDecoration: "none" }}>
        <div className="product-image">
          <span>{product.slug.split("-").slice(0, 2).join(" ")}</span>
        </div>
      </Link>
      <div className="body stack" style={{ gap: "0.75rem" }}>
        <div>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            {product.category}
          </span>
          <h3 style={{ margin: "0.3rem 0 0", fontSize: "1rem", fontWeight: 700, lineHeight: 1.3 }}>
            {product.title}
          </h3>
        </div>

        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          {product.description.length > 90
            ? product.description.slice(0, 90) + "…"
            : product.description}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: "1.05rem" }}>
            {product.variants.length > 1 ? "from " : ""}
            {formatCurrency(lowestPrice)}
          </strong>
          <span
            style={{
              fontSize: "0.75rem",
              color:
                totalStock === 0
                  ? "var(--danger)"
                  : totalStock < 5
                    ? "var(--warning)"
                    : "var(--success)",
            }}
          >
            {totalStock === 0 ? "Out of stock" : totalStock < 5 ? `${totalStock} left` : "In stock"}
          </span>
        </div>

        <Link
          href={`/products/${product.slug}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            padding: "0.75rem 1rem",
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            color: "#130f0b",
            fontWeight: 700,
            fontSize: "0.88rem",
            textDecoration: "none",
            minHeight: 44,
          }}
        >
          Shop now
        </Link>
      </div>
    </article>
  );
}
