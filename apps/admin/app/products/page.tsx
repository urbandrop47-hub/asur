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
type BulkAction = "active" | "draft" | "archived" | "delete" | "export-csv";

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }

function productsToCSV(products: ProductWithSummary[]): string {
  const header = ["ID", "Title", "Category", "Status", "Variants", "Stock", "Min Price", "Max Price"];
  const rows = products.map((p) => [
    p.id, `"${p.title.replace(/"/g, '""')}"`, p.category, p.status,
    p.variantCount, p.totalStock,
    p.priceRange?.min ?? 0, p.priceRange?.max ?? 0
  ].join(","));
  return [header.join(","), ...rows].join("\r\n");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = () => {
    setSelected(new Set());
    api
      .get<{ data: ProductWithSummary[] }>("/api/v1/admin/products")
      .then((r) => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === "all" ? products : products.filter((p) => p.status === filter);
  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); filtered.forEach((p) => n.delete(p.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); filtered.forEach((p) => n.add(p.id)); return n; });
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleBulkAction(action: BulkAction) {
    const ids = [...selected];
    if (ids.length === 0) return;

    if (action === "export-csv") {
      const toExport = products.filter((p) => ids.includes(p.id));
      const csv = productsToCSV(toExport);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asur-products-${isoDay(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (action === "delete" && !confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) return;

    setBulkLoading(true);
    try {
      await api.patch("/api/v1/admin/products/bulk", { ids, action });
      load();
    } catch {
      alert("Bulk action failed. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  }

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
            onClick={() => { setFilter(f); setSelected(new Set()); }}
            style={{
              padding: "0.4rem 0.9rem", borderRadius: 999, border: "1px solid var(--border)",
              background: filter === f ? "rgba(56,189,248,0.12)" : "transparent",
              color: filter === f ? "var(--accent)" : "var(--text-muted)",
              fontSize: "0.8rem", fontWeight: filter === f ? 600 : 400, cursor: "pointer",
              textTransform: "capitalize", fontFamily: "inherit"
            }}
          >{f}</button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
          padding: "0.65rem 1.25rem", marginBottom: "0.75rem",
          border: "1px solid rgba(56,189,248,0.3)", borderRadius: 12,
          background: "rgba(56,189,248,0.07)"
        }}>
          <span style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600 }}>
            {selected.size} selected
          </span>
          {(["active", "draft", "archived"] as BulkAction[]).map((a) => (
            <button
              key={a}
              disabled={bulkLoading}
              onClick={() => handleBulkAction(a)}
              style={{ padding: "0.35rem 0.8rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}
            >Set {a}</button>
          ))}
          <button
            onClick={() => handleBulkAction("export-csv")}
            style={{ padding: "0.35rem 0.8rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
          >Export CSV</button>
          <button
            disabled={bulkLoading}
            onClick={() => handleBulkAction("delete")}
            style={{ padding: "0.35rem 0.8rem", borderRadius: 8, border: "1px solid rgba(239,68,68,0.5)", background: "transparent", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
          >Delete</button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ marginLeft: "auto", padding: "0.35rem 0.8rem", borderRadius: 8, border: "none", background: "transparent", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
          >Clear</button>
        </div>
      )}

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
          <div style={{ display: "grid", gridTemplateColumns: "32px 2fr 0.7fr 0.6fr 0.6fr 0.8fr", gap: "1rem", padding: "0.65rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ cursor: "pointer", accentColor: "var(--accent)" }}
            />
            {["Product", "Status", "Variants", "Stock", "Price"].map((h) => (
              <span key={h} style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {filtered.map((p) => {
            const isSelected = selected.has(p.id);
            return (
              <div
                key={p.id}
                style={{
                  display: "grid", gridTemplateColumns: "32px 2fr 0.7fr 0.6fr 0.6fr 0.8fr",
                  gap: "1rem", padding: "0.85rem 1.25rem",
                  borderBottom: "1px solid var(--border)", alignItems: "center",
                  background: isSelected ? "rgba(56,189,248,0.04)" : undefined
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(p.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: "pointer", accentColor: "var(--accent)" }}
                />
                <Link
                  href={`/products/${p.id}`}
                  style={{ display: "contents", color: "var(--text)" }}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
