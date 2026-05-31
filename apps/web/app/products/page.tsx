"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    api
      .get<{ data: Product[] }>("/api/v1/products")
      .then((res) => setProducts(res.data))
      .catch((err: Error) => setError(err.message ?? "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>All Products</h1>
          <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {loading ? "Loading…" : error ? "" : `${products.length} item${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/cart" className="badge">
          View cart
        </Link>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 5v5M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}. Check that the backend is running.
        </div>
      )}

      <div className="grid-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
          : products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
      </div>

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <p>No products found. Add some from the admin panel.</p>
          <Link href="/" className="badge">
            Go home
          </Link>
        </div>
      )}
    </div>
  );
}
