"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { api } from "../../lib/api";

type ProductWithSummary = Product & {
  variantCount: number;
  totalStock: number;
  priceRange: { min: number; max: number } | null;
};

const STATUS_CLASS: Record<string, string> = {
  active: "badge success",
  draft: "badge draft",
  archived: "badge"
};

type Filter = "all" | "active" | "draft" | "archived";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    api
      .get<{ data: ProductWithSummary[] }>("/api/v1/admin/products")
      .then((r) => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? products : products.filter((p) => p.status === filter);

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Products</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {products.length} total
          </p>
        </div>
        <Link href="/products/new" className="btn-primary">+ New product</Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {(["all", "active", "draft", "archived"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.4rem 0.9rem", borderRadius: 999, border: "1px solid var(--border)",
              background: filter === f ? "rgba(56,189,248,0.12)" : "transparent",
              color: filter === f ? "var(--accent)" : "var(--text-muted)",
              fontSize: "0.8rem", fontWeight: filter === f ? 600 : 400, cursor: "pointer",
              textTransform: "capitalize", fontFamily: "inherit"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h2>No products</h2>
          <p>{filter !== "all" ? `No ${filter} products.` : "Create your first product."}</p>
        </div>
      ) : (
        <div className="table-card">
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 0.6fr 0.6fr 0.8fr", gap: "1rem", padding: "0.65rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            {["Product", "Status", "Variants", "Stock", "Price"].map((h) => (
              <span key={h} style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              style={{
                display: "grid", gridTemplateColumns: "2fr 0.7fr 0.6fr 0.6fr 0.8fr",
                gap: "1rem", padding: "0.85rem 1.25rem",
                borderBottom: "1px solid var(--border)", alignItems: "center",
                color: "var(--text)"
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>{p.title}</p>
                <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.category}</p>
              </div>
              <span className={STATUS_CLASS[p.status] ?? "badge"}>{p.status}</span>
              <span style={{ fontSize: "0.85rem" }}>{p.variantCount}</span>
              <span style={{ fontSize: "0.85rem" }}>{p.totalStock}</span>
              <span style={{ fontSize: "0.85rem" }}>
                {p.priceRange
                  ? p.priceRange.min === p.priceRange.max
                    ? formatCurrency(p.priceRange.min)
                    : `${formatCurrency(p.priceRange.min)}–${formatCurrency(p.priceRange.max)}`
                  : "—"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
