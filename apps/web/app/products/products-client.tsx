"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import type { Product } from "@asur/types";
import { ProductCard } from "../../components/product-card";
import { FilterSheet } from "../../components/asur/filter-sheet";
import { api } from "../../lib/api";
import {
  DEFAULT_FILTERS,
  PRICE_BOUNDS,
  activeFilterChips,
  countActiveFilters,
  filtersFromParams,
  filtersToApiQuery,
  filtersToParams,
  type ProductFilters
} from "../../lib/filter-params";

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

function ProductsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const collectionSlug = searchParams.get("collection") ?? undefined;
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const sizes = useMemo(() => [...new Set(products.flatMap((p) => p.variants.map((v) => v.size)))].sort(), [products]);
  const colors = useMemo(() => [...new Set(products.flatMap((p) => p.variants.map((v) => v.color)))].sort(), [products]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = filtersToApiQuery(filters, collectionSlug);
    api
      .get<{ data: Product[] }>(`/api/v1/products${qs}`)
      .then((res) => setProducts(res.data))
      .catch((err: Error) => setError(err.message ?? "Failed to load products"))
      .finally(() => setLoading(false));
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function pushFilters(f: ProductFilters) {
    const p = filtersToParams(f);
    if (collectionSlug) p.set("collection", collectionSlug);
    router.push(`/products?${p.toString()}`);
  }

  function clearAllFilters() {
    const p = new URLSearchParams();
    if (collectionSlug) p.set("collection", collectionSlug);
    router.push(`/products${p.toString() ? `?${p.toString()}` : ""}`);
  }

  const chips = useMemo(() => activeFilterChips(filters), [filters]);
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const collectionLabel = collectionSlug
    ? collectionSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <div className="stack">
      {/* ── Hero strip ── */}
      <div className="products-hero">
        <div className="products-hero-eyebrow">
          <span>●</span> {collectionLabel ? `Collection · ${collectionLabel}` : filters.q ? `Search results for "${filters.q}"` : "All Products"}
        </div>
        <h1>
          {collectionLabel ? (
            <span style={{ background: "linear-gradient(135deg, #f97316, #fb7185)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {collectionLabel}
            </span>
          ) : filters.q ? (
            <>
              Results for<br />
              <span style={{ background: "linear-gradient(135deg, #f97316, #fb7185)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                "{filters.q}"
              </span>
            </>
          ) : (
            <>
              The<br />
              <span style={{ background: "linear-gradient(135deg, #f97316, #fb7185)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Collection
              </span>
            </>
          )}
        </h1>
        <p className="products-hero-sub">
          {loading
            ? "Loading the latest drops…"
            : error
              ? ""
              : `${products.length} piece${products.length !== 1 ? "s" : ""}${collectionLabel ? ` in ${collectionLabel}` : activeCount > 0 ? " matching your filters" : " · hand-picked for the culture"}`}
        </p>

        {collectionSlug && (
          <Link href="/collections" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-muted)", fontSize: "0.82rem", textDecoration: "none", marginTop: "0.5rem" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M8 2L3 6.5 8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All Collections
          </Link>
        )}
      </div>

      {/* ── Toolbar: sort + filter button ── */}
      {!loading && !error && (
        <div className="products-toolbar">
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {products.length} result{products.length !== 1 ? "s" : ""}
          </div>
          <div className="products-toolbar-right">
            <select
              className="sort-select"
              value={filters.sort}
              onChange={(e) => pushFilters({ ...filters, sort: e.target.value as ProductFilters["sort"] })}
              aria-label="Sort products"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="popularity">Popular</option>
            </select>
            <button
              className={`filter-btn${activeCount > 0 ? " active" : ""}`}
              onClick={() => setFilterOpen(true)}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M1 3h11M3 6.5h7M5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filters
              {activeCount > 0 && <span className="filter-btn-badge">{activeCount}</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── Active filter chips ── */}
      {chips.length > 0 && (
        <div className="active-filters" role="group" aria-label="Active filters">
          <span className="active-filters-label">Active:</span>
          {chips.map((chip) => (
            <span key={chip.key} className="active-chip">
              {chip.label}
              <button onClick={() => pushFilters(chip.remove())} aria-label={`Remove filter: ${chip.label}`}>×</button>
            </span>
          ))}
          <button className="active-filters-clear" onClick={clearAllFilters}>Clear all</button>
        </div>
      )}

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
          : products.map((product, i) => (
              <div key={product.slug} className="animate-in" style={{ animationDelay: `${Math.min(i * 0.06, 0.5)}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
      </div>

      {/* ── Empty state ── */}
      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <p>
            {activeCount > 0 || filters.q
              ? "No products match the current filters."
              : "No products found. Add some from the admin panel."}
          </p>
          {(activeCount > 0 || filters.q) && (
            <button className="filter-pill active" onClick={clearAllFilters}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Filter sheet ── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onChange={(f) => { pushFilters(f); setFilterOpen(false); }}
        resultCount={products.length}
        categories={categories}
        sizes={sizes}
        colors={colors}
      />
    </div>
  );
}

export default function ProductsClient() {
  return (
    <Suspense fallback={
      <div className="stack">
        <div className="products-hero" style={{ animation: "none" }}>
          <div className="skeleton skeleton-line" style={{ height: 20, width: "30%", marginBottom: "0.85rem" }} />
          <div className="skeleton skeleton-line" style={{ height: 72, width: "60%" }} />
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
      <ProductsPageInner />
    </Suspense>
  );
}
