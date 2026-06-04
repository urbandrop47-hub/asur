"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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

const PAGE_SIZE = 24;

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

function Pagination({
  page,
  total,
  pageSize,
  onPage
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  // Build page window: always show first, last, current ±1, and ellipsis
  const pages: (number | "…")[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
  add(1);
  if (page > 3) pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
  if (page < totalPages - 2) pages.push("…");
  if (totalPages > 1) add(totalPages);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "2rem", flexWrap: "wrap" }}>
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        style={{
          padding: "0.5rem 0.85rem",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "none",
          color: page <= 1 ? "var(--text-muted)" : "var(--text)",
          cursor: page <= 1 ? "default" : "pointer",
          fontSize: "0.85rem"
        }}
        aria-label="Previous page"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} style={{ padding: "0.5rem 0.4rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: p === page ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: p === page ? "var(--accent)" : "none",
              color: p === page ? "#130f0b" : "var(--text)",
              fontWeight: p === page ? 700 : 400,
              cursor: p === page ? "default" : "pointer",
              fontSize: "0.85rem",
              minWidth: 36
            }}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        style={{
          padding: "0.5rem 0.85rem",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "none",
          color: page >= totalPages ? "var(--text-muted)" : "var(--text)",
          cursor: page >= totalPages ? "default" : "pointer",
          fontSize: "0.85rem"
        }}
        aria-label="Next page"
      >
        →
      </button>

      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
        {total} result{total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function ProductsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const collectionSlug = searchParams.get("collection") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
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
    // Append pagination params
    const sep = qs.includes("?") ? "&" : "?";
    const paginatedQs = `${qs}${sep}page=${page}&limit=${PAGE_SIZE}`;
    api
      .get<{ data: Product[]; meta?: { page: number; pageSize: number; total: number } }>(
        `/api/v1/products${paginatedQs}`
      )
      .then((res) => {
        setProducts(res.data);
        setTotal(res.meta?.total ?? res.data.length);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load products"))
      .finally(() => setLoading(false));
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function pushFilters(f: ProductFilters) {
    const p = filtersToParams(f);
    if (collectionSlug) p.set("collection", collectionSlug);
    // Reset to page 1 when filters change
    router.push(`/products?${p.toString()}`);
  }

  function clearAllFilters() {
    const p = new URLSearchParams();
    if (collectionSlug) p.set("collection", collectionSlug);
    router.push(`/products${p.toString() ? `?${p.toString()}` : ""}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`/products?${params.toString()}`);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              : `${total} piece${total !== 1 ? "s" : ""}${collectionLabel ? ` in ${collectionLabel}` : activeCount > 0 ? " matching your filters" : " · hand-picked for the culture"}`}
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
            {total > PAGE_SIZE
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
              : `${total} result${total !== 1 ? "s" : ""}`}
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

      {/* ── Pagination ── */}
      {!loading && !error && (
        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPage={goToPage}
        />
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
