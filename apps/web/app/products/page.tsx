"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    api
      .get<{ data: Product[] }>("/api/v1/products")
      .then((res) => setProducts(res.data))
      .catch((err: Error) => setError(err.message ?? "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))].sort();
    return cats;
  }, [products]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  const activeCount = loading ? null : filtered.length;

  return (
    <div className="stack">
      {/* ── Hero strip ── */}
      <div className="products-hero">
        <div className="products-hero-eyebrow">
          <span>●</span> All Products
        </div>
        <h1>
          The<br />
          <span style={{
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Collection
          </span>
        </h1>
        <p className="products-hero-sub">
          {loading
            ? "Loading the latest drops…"
            : error
              ? ""
              : `${products.length} piece${products.length !== 1 ? "s" : ""} · hand-picked for the culture`}
        </p>

        {/* Category filter pills */}
        {!loading && !error && categories.length > 0 && (
          <div className="filter-pills">
            <button
              className={`filter-pill${activeCategory === "all" ? " active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              All ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-pill${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat} ({products.filter((p) => p.category === cat).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 5v5M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}. Check that the backend is running.
        </div>
      )}

      {/* ── Product grid ── */}
      <div className="grid-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
          : filtered.map((product, i) => (
              <div
                key={product.slug}
                className="animate-in"
                style={{ animationDelay: `${Math.min(i * 0.06, 0.5)}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
      </div>

      {/* ── Filter: no results ── */}
      {!loading && !error && filtered.length === 0 && activeCategory !== "all" && (
        <div className="empty-state">
          <p>No products in &ldquo;{activeCategory}&rdquo;.</p>
          <button className="filter-pill active" onClick={() => setActiveCategory("all")}>
            Show all →
          </button>
        </div>
      )}

      {/* ── Truly empty ── */}
      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <p>No products found. Add some from the admin panel.</p>
          <Link href="/" className="badge">Go home</Link>
        </div>
      )}

      {/* ── Results count (when filtered) ── */}
      {!loading && !error && activeCategory !== "all" && activeCount !== null && activeCount > 0 && (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
          Showing {activeCount} of {products.length} products
        </p>
      )}
    </div>
  );
}
