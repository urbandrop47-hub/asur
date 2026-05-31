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
        if (!res.data) {
          setNotFound(true);
        } else {
          setProduct(res.data);
          track("product_viewed", { id: res.data.id, slug: res.data.slug, title: res.data.title });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pdp-layout">
        <div className="skeleton skeleton-image" style={{ aspectRatio: "4/5", borderRadius: 24 }} />
        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="skeleton skeleton-line-sm" />
          <div className="skeleton skeleton-line" style={{ height: 40 }} />
          <div className="skeleton skeleton-line" style={{ width: "40%", height: 32 }} />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <h2>Product not found</h2>
        <p>This product doesn&apos;t exist or has been removed.</p>
        <Link href="/products" className="badge">
          Back to products
        </Link>
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
  const displayPrice =
    selectedVariant
      ? selectedVariant.price
      : Math.min(...product.variants.map((v) => v.price));

  const stockInfo = variantStock !== null ? stockLabel(variantStock) : null;

  function isComboAvailable(size: string, color: string) {
    return product!.variants.some((v) => v.size === size && v.color === color && v.stock > 0);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "1.5rem",
          color: "var(--text-muted)",
          fontSize: "0.83rem",
        }}
      >
        <Link href="/products" style={{ textDecoration: "none", color: "inherit" }}>
          Products
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{product.title}</span>
      </nav>

      <div className="pdp-layout">
        {/* Gallery */}
        <div className="pdp-gallery">
          <ProductImageGallery media={product.media} title={product.title} />
        </div>

        {/* Info */}
        <div className="pdp-info">
          {/* Badges */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: 999,
                background: "rgba(59,130,246,0.12)",
                color: "#bfdbfe",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {product.category}
            </span>
            {product.drop && (
              <span
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: 999,
                  background: "rgba(249,115,22,0.12)",
                  color: "#fed7aa",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {product.drop.name}
              </span>
            )}
            {product.fit && (
              <span
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {product.fit}
              </span>
            )}
          </div>

          <div>
            <h1
              style={{
                margin: "0 0 0.5rem",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {product.title}
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7, fontSize: "0.95rem" }}>
              {product.description}
            </p>
          </div>

          {/* Price + stock */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span className="pdp-price">
              {product.variants.length > 1 && !selectedVariant ? "from " : ""}
              {formatCurrency(displayPrice)}
            </span>
            {stockInfo && (
              <span className="pdp-stock">
                <span
                  className="pdp-stock-dot"
                  style={{ background: stockInfo.color }}
                />
                <span style={{ color: stockInfo.color, fontSize: "0.82rem" }}>{stockInfo.text}</span>
              </span>
            )}
          </div>

          <hr className="pdp-divider" />

          {/* Size picker */}
          {sizes.length > 0 && (
            <div>
              <p
                style={{
                  margin: "0 0 0.65rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Size{selectedSize && <span style={{ color: "var(--text)" }}> — {selectedSize}</span>}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                      style={{
                        minWidth: 52,
                        minHeight: 44,
                        padding: "0.4rem 0.8rem",
                        borderRadius: 10,
                        border: selected
                          ? "2px solid var(--accent)"
                          : "1px solid rgba(255,255,255,0.14)",
                        background: selected
                          ? "rgba(249,115,22,0.1)"
                          : "rgba(255,255,255,0.04)",
                        color: available ? "var(--text)" : "rgba(246,241,234,0.3)",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        cursor: available ? "pointer" : "not-allowed",
                        textDecoration: available ? "none" : "line-through",
                        transition: "border-color 140ms ease, background 140ms ease",
                      }}
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
              <p
                style={{
                  margin: "0 0 0.65rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Color{selectedColor && <span style={{ color: "var(--text)" }}> — {selectedColor}</span>}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                      style={{
                        minHeight: 44,
                        padding: "0.4rem 1rem",
                        borderRadius: 10,
                        border: selected
                          ? "2px solid var(--accent)"
                          : "1px solid rgba(255,255,255,0.14)",
                        background: selected
                          ? "rgba(249,115,22,0.1)"
                          : "rgba(255,255,255,0.04)",
                        color: available ? "var(--text)" : "rgba(246,241,234,0.3)",
                        fontWeight: 500,
                        fontSize: "0.88rem",
                        cursor: available ? "pointer" : "not-allowed",
                        textDecoration: available ? "none" : "line-through",
                        transition: "border-color 140ms ease, background 140ms ease",
                      }}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKU info */}
          {selectedVariant && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
              }}
            >
              SKU:{" "}
              <span style={{ color: "var(--text)", fontFamily: "monospace" }}>
                {selectedVariant.sku}
              </span>
            </div>
          )}

          <hr className="pdp-divider" />

          {/* Add to cart CTA */}
          <button
            className="btn-full btn-primary"
            disabled={!selectedVariant || variantStock === 0}
            style={{ fontSize: "1rem" }}
            onClick={() => {
              if (!selectedVariant || !product) return;
              addItem({
                productId: product.id,
                productTitle: product.title,
                productSlug: product.slug,
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

          {added && (
            <Link
              href="/cart"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                fontSize: "0.88rem",
                fontWeight: 600,
                textDecoration: "none",
                gap: 6,
              }}
            >
              View cart
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}

          <Link
            href="/products"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              textDecoration: "none",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to all products
          </Link>
        </div>
      </div>
    </div>
  );
}
