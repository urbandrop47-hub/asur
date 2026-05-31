import Image from "next/image";
import Link from "next/link";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";

export function ProductCard({ product }: { product: Product }) {
  const lowestPrice = product.variants.length > 0 ? Math.min(...product.variants.map((v) => v.price)) : 0;
  const lowestCompare = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.compareAtPrice ?? Infinity))
    : Infinity;
  const hasDiscount = isFinite(lowestCompare) && lowestCompare > lowestPrice;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const coverImage = product.media?.[0];

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} style={{ display: "block", textDecoration: "none" }}>
        <div className="product-image" style={{ position: "relative", overflow: "hidden" }}>
          {coverImage?.url ? (
            <Image
              src={coverImage.url}
              alt={coverImage.alt ?? product.title}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {product.slug.split("-").slice(0, 2).join(" ")}
            </span>
          )}
          {totalStock === 0 && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(246,241,234,0.7)" }}>
                Sold out
              </span>
            </div>
          )}
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
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
            <strong style={{ fontSize: "1.05rem" }}>
              {product.variants.length > 1 ? "from " : ""}
              {formatCurrency(lowestPrice)}
            </strong>
            {hasDiscount && (
              <s style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 400 }}>
                {formatCurrency(lowestCompare)}
              </s>
            )}
          </div>
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
            background: totalStock === 0
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #f97316, #fb7185)",
            color: totalStock === 0 ? "var(--text-muted)" : "#130f0b",
            fontWeight: 700,
            fontSize: "0.88rem",
            textDecoration: "none",
            minHeight: 44,
            pointerEvents: totalStock === 0 ? "none" : "auto",
          }}
          aria-disabled={totalStock === 0}
        >
          {totalStock === 0 ? "Sold out" : "Shop now"}
        </Link>
      </div>
    </article>
  );
}
