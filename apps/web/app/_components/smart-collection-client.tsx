"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import type { Product } from "@asur/types";
import { ProductCard } from "../../components/product-card";
import { api } from "../../lib/api";

function ProductSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line-sm" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton skeleton-line" style={{ height: 44, borderRadius: 999, marginTop: 4 }} />
      </div>
    </div>
  );
}

interface Props {
  endpoint: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  emptyMessage: string;
  accentColor?: string;
  showRank?: boolean;
}

function SmartCollectionInner({ endpoint, title, eyebrow, subtitle, emptyMessage, accentColor = "rgba(249,115,22,0.8)", showRank = false }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ data: Product[] }>(endpoint)
      .then((res) => setProducts(res.data ?? []))
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [endpoint]);

  return (
    <div className="stack">
      {/* ── Hero strip ── */}
      <div className="products-hero">
        <div className="products-hero-eyebrow">
          <span>●</span> {eyebrow}
        </div>
        <h1>
          <span style={{
            background: `linear-gradient(135deg, ${accentColor}, #fb7185)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {title}
          </span>
        </h1>
        <p className="products-hero-sub">
          {loading ? "Loading…" : error ? "" : products.length > 0 ? subtitle : emptyMessage}
        </p>
        <Link
          href="/products"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            color: "var(--text-muted)", fontSize: "0.82rem",
            textDecoration: "none", marginTop: "0.5rem"
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M8 2L3 6.5 8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Shop All
        </Link>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="error-banner">
          {error}. Check that the backend is running.
        </div>
      )}

      {/* ── Grid ── */}
      <div className="grid-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
          : products.map((product, i) => (
              <div key={product.slug} style={{ position: "relative", animation: "fadeInUp 0.3s ease both", animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}>
                {showRank && (
                  <div style={{
                    position: "absolute", top: -8, left: -4, zIndex: 3,
                    width: 28, height: 28, borderRadius: "50%",
                    background: i < 3 ? accentColor : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.68rem", fontWeight: 900, color: i < 3 ? "#130f0b" : "var(--text-muted)",
                    backdropFilter: "blur(8px)",
                    boxShadow: i < 3 ? `0 0 12px ${accentColor}` : "none",
                  }}>
                    {i + 1}
                  </div>
                )}
                <ProductCard product={product} priority={i < 4} />
              </div>
            ))}
      </div>

      {/* ── Empty state ── */}
      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <p>{emptyMessage}</p>
          <Link href="/products" className="filter-pill active" style={{ display: "inline-block", marginTop: "0.75rem" }}>
            Browse all products
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SmartCollectionClient(props: Props) {
  return (
    <Suspense fallback={
      <div className="stack">
        <div className="products-hero" style={{ animation: "none" }}>
          <div className="skeleton skeleton-line" style={{ height: 20, width: "20%", marginBottom: "0.85rem" }} />
          <div className="skeleton skeleton-line" style={{ height: 72, width: "50%" }} />
        </div>
        <div className="grid-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-image" />
              <div className="skeleton-body">
                <div className="skeleton skeleton-line-sm" />
                <div className="skeleton skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <SmartCollectionInner {...props} />
    </Suspense>
  );
}
