"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { api } from "../../../lib/api";
import { track } from "../../../lib/analytics";
import { ProductImageGallery } from "../../../components/product-image-gallery";
import { useCartStore } from "../../../store/cart-store";

function stockLabel(stock: number) {
  if (stock === 0) return { text: "Out of stock", color: "var(--danger)" };
  if (stock < 5) return { text: `Only ${stock} left`, color: "var(--warning)" };
  return { text: "In stock", color: "var(--success)" };
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!slug) return;
    api
      .get<{ data: Product | null }>(`/api/v1/products/${slug}`)
      .then((res) => {
        if (!res.data) { setNotFound(true); }
        else {
          setProduct(res.data);
          track("product_viewed", { id: res.data.id, slug: res.data.slug, title: res.data.title });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pdp-layout" style={{ animation: "fadeIn 0.4s ease both" }}>
        <div className="skeleton skeleton-image" style={{ aspectRatio: "4/5", borderRadius: 24 }} />
        <div style={{ display: "grid", gap: "1.2rem" }}>
          <div className="skeleton skeleton-line-sm" />
          <div className="skeleton skeleton-line" style={{ height: 44 }} />
          <div className="skeleton skeleton-line" style={{ width: "40%", height: 32 }} />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" style={{ width: "80%" }} />
          <div className="skeleton skeleton-line" style={{ height: 50, borderRadius: 999, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <h2>Product not found</h2>
        <p>This product doesn&apos;t exist or has been removed.</p>
        <Link href="/products" className="badge">Back to products</Link>
      </div>
    );
  }

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];

  const selectedVariant =
    selectedSize && selectedColor
      ? product.variants.find((v) => v.size === selectedSize && v.color === selectedColor)
      : null;

  const variantStock = selectedVariant ? selectedVariant.stock : null;
  const displayPrice = selectedVariant
    ? selectedVariant.price
    : Math.min(...product.variants.map((v) => v.price));
  const comparePrice = selectedVariant?.compareAtPrice
    ?? (product.variants.every((v) => v.compareAtPrice)
      ? Math.min(...product.variants.map((v) => v.compareAtPrice!))
      : undefined);

  const stockInfo = variantStock !== null ? stockLabel(variantStock) : null;
  const canAddToCart = !!selectedVariant && variantStock !== 0;

  function isComboAvailable(size: string, color: string) {
    return product!.variants.some((v) => v.size === size && v.color === color && v.stock > 0);
  }

  const pickerBtn = (selected: boolean, available: boolean): React.CSSProperties => ({
    minWidth: 52, minHeight: 44, padding: "0.45rem 0.9rem", borderRadius: 10,
    border: selected ? "2px solid var(--accent)" : "1px solid rgba(255,255,255,0.14)",
    background: selected ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.04)",
    color: available ? "var(--text)" : "rgba(246,241,234,0.25)",
    fontWeight: selected ? 700 : 500, fontSize: "0.88rem",
    cursor: available ? "pointer" : "not-allowed",
    textDecoration: available ? "none" : "line-through",
    transition: "border-color 150ms ease, background 150ms ease, transform 100ms ease",
    transform: selected ? "scale(1.04)" : "scale(1)",
  });

  return (
    <div style={{ animation: "fadeInUp 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
      {/* Breadcrumb */}
      <nav style={{
        display: "flex", gap: "0.5rem", alignItems: "center",
        marginBottom: "1.75rem", color: "var(--text-muted)", fontSize: "0.82rem",
      }}>
        <Link href="/products" style={{ textDecoration: "none", color: "inherit", transition: "color 140ms" }}>
          Products
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: "var(--text)" }}>{product.title}</span>
      </nav>

      <div className="pdp-layout">
        {/* Gallery */}
        <div className="pdp-gallery">
          <ProductImageGallery media={product.media} title={product.title} />
        </div>

        {/* Info panel */}
        <div className="pdp-info">
          {/* Badges */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{
              padding: "0.28rem 0.7rem", borderRadius: 999,
              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
              color: "#bfdbfe", fontSize: "0.7rem", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              {product.category}
            </span>
            {product.drop && (
              <span style={{
                padding: "0.28rem 0.7rem", borderRadius: 999,
                background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)",
                color: "#fed7aa", fontSize: "0.7rem", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {product.drop.name}
              </span>
            )}
            {product.fit && (
              <span style={{
                padding: "0.28rem 0.7rem", borderRadius: 999,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {product.fit}
              </span>
            )}
          </div>

          {/* Title + description */}
          <div>
            <h1 style={{ margin: "0 0 0.6rem", fontSize: "clamp(1.5rem, 3vw, 2.1rem)", fontWeight: 800, lineHeight: 1.15 }}>
              {product.title}
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7, fontSize: "0.93rem" }}>
              {product.description}
            </p>
          </div>

          {/* Price + stock */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span className="pdp-price">
                {product.variants.length > 1 && !selectedVariant ? "from " : ""}
                {formatCurrency(displayPrice)}
              </span>
              {comparePrice && comparePrice > displayPrice && (
                <s style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>
                  {formatCurrency(comparePrice)}
                </s>
              )}
            </div>
            {stockInfo && (
              <span className="pdp-stock">
                <span className="pdp-stock-dot" style={{ background: stockInfo.color }} />
                <span style={{ color: stockInfo.color, fontSize: "0.82rem", fontWeight: 600 }}>
                  {stockInfo.text}
                </span>
              </span>
            )}
          </div>

          <hr className="pdp-divider" />

          {/* Size picker */}
          {sizes.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Size
                {selectedSize
                  ? <span style={{ color: "var(--text)", marginLeft: "0.4rem" }}>— {selectedSize}</span>
                  : <span style={{ color: "rgba(246,241,234,0.35)", marginLeft: "0.4rem", fontWeight: 400 }}>— select one</span>}
              </p>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {sizes.map((size) => {
                  const available = selectedColor
                    ? isComboAvailable(size, selectedColor)
                    : product.variants.some((v) => v.size === size && v.stock > 0);
                  const selected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selected ? null : size)}
                      disabled={!available}
                      style={pickerBtn(selected, available)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color picker */}
          {colors.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Color
                {selectedColor
                  ? <span style={{ color: "var(--text)", marginLeft: "0.4rem" }}>— {selectedColor}</span>
                  : <span style={{ color: "rgba(246,241,234,0.35)", marginLeft: "0.4rem", fontWeight: 400 }}>— select one</span>}
              </p>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {colors.map((color) => {
                  const available = selectedSize
                    ? isComboAvailable(selectedSize, color)
                    : product.variants.some((v) => v.color === color && v.stock > 0);
                  const selected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(selected ? null : color)}
                      disabled={!available}
                      style={pickerBtn(selected, available)}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKU chip */}
          {selectedVariant && (
            <div style={{
              padding: "0.6rem 0.9rem", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              fontSize: "0.8rem", color: "var(--text-muted)",
              animation: "fadeInUp 0.25s ease both",
            }}>
              SKU: <span style={{ color: "var(--text)", fontFamily: "var(--f-mono)", letterSpacing: "0.04em" }}>{selectedVariant.sku}</span>
            </div>
          )}

          <hr className="pdp-divider" />

          {/* Add to cart */}
          <button
            className="btn-full btn-primary"
            disabled={!canAddToCart}
            style={{
              fontSize: "1rem",
              background: added
                ? "rgba(34,197,94,0.85)"
                : canAddToCart
                  ? "linear-gradient(135deg, #f97316, #fb7185)"
                  : "rgba(255,255,255,0.07)",
              color: canAddToCart || added ? "#130f0b" : "var(--text-muted)",
              transition: "background 300ms ease, transform 120ms ease",
            }}
            onClick={() => {
              if (!selectedVariant || !product) return;
              addItem({
                productId: product.id,
                productTitle: product.title,
                productSlug: product.slug,
                imageUrl: product.media?.[0]?.url,
                variantSku: selectedVariant.sku,
                unitPrice: selectedVariant.price,
                quantity: 1,
                size: selectedVariant.size,
                color: selectedVariant.color,
              });
              setAdded(true);
              if (addedTimer.current) clearTimeout(addedTimer.current);
              addedTimer.current = setTimeout(() => setAdded(false), 2200);
            }}
          >
            {added
              ? "✓ Added to cart"
              : !selectedSize || !selectedColor
                ? "Select size & color"
                : variantStock === 0
                  ? "Out of stock"
                  : "Add to cart"}
          </button>

          {/* View cart link */}
          {added && (
            <Link
              href="/cart"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--accent)", fontSize: "0.88rem", fontWeight: 600,
                textDecoration: "none", gap: 6,
                animation: "fadeInUp 0.3s ease both",
              }}
            >
              View cart
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}

          {/* Delivery info strip */}
          <div style={{
            display: "flex", gap: "1rem", flexWrap: "wrap",
            padding: "0.85rem 1rem", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {[
              { icon: "🚚", text: "Free shipping ₹1,500+" },
              { icon: "↩️", text: "Easy returns" },
              { icon: "🔒", text: "Secure checkout" },
            ].map(({ icon, text }) => (
              <span key={text} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <span aria-hidden="true">{icon}</span> {text}
              </span>
            ))}
          </div>

          {/* Back link */}
          <Link
            href="/products"
            style={{
              display: "inline-flex", alignItems: "center",
              color: "var(--text-muted)", fontSize: "0.83rem",
              textDecoration: "none", gap: 5,
              transition: "color 140ms ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to all products
          </Link>
        </div>
      </div>
    </div>
  );
}
