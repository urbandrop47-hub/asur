"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { api } from "../../lib/api";

type SortKey = "title" | "totalStock" | "status";
type SortDir = "asc" | "desc";

const LOW_STOCK = 5;

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
        Out of stock
      </span>
    );
  }
  if (stock < LOW_STOCK) {
    return (
      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
        Low ({stock})
      </span>
    );
  }
  return (
    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
      {stock}
    </span>
  );
}

type InlineStockEditorProps = {
  productId: string;
  sku: string;
  current: number;
  onSaved: (newStock: number) => void;
};

function InlineStockEditor({ productId, sku, current, onSaved }: InlineStockEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.select(), 30);
  }, [editing]);

  async function save() {
    const newStock = parseInt(value, 10);
    if (isNaN(newStock) || newStock < 0) { setEditing(false); setValue(String(current)); return; }
    setSaving(true);
    try {
      await api.patch("/api/v1/admin/inventory/stock", { productId, sku, stock: newStock });
      onSaved(newStock);
      setEditing(false);
    } catch {
      // revert
      setValue(String(current));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setEditing(true); setValue(String(current)); }}
        style={{
          background: "none", border: "1px dashed rgba(255,255,255,0.18)", borderRadius: 8,
          color: "var(--text-muted)", padding: "2px 10px", cursor: "pointer", fontSize: "0.85rem",
          minWidth: 48
        }}
        title="Click to edit stock"
      >
        {current}
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <input
        ref={inputRef}
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setValue(String(current)); } }}
        style={{
          width: 64, padding: "2px 6px", borderRadius: 6,
          border: "1px solid var(--accent)", background: "rgba(255,255,255,0.05)",
          color: "var(--text)", fontSize: "0.85rem", textAlign: "center"
        }}
      />
      <button onClick={save} disabled={saving} style={{ fontSize: "0.75rem", cursor: "pointer", background: "none", border: "none", color: "var(--success)" }}>
        {saving ? "…" : "✓"}
      </button>
    </span>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // CSV bulk upload
  const [csvText, setCsvText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ updated: number; skipped: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function fetchInventory() {
    setLoading(true);
    api
      .get<{ data: { products: Product[] } }>("/api/v1/admin/inventory")
      .then((r) => setProducts(r.data.products))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchInventory(); }, []);

  // Flatten all products → variant rows
  const rows = products.flatMap((p) =>
    p.variants.map((v) => ({
      productId: p.id,
      productTitle: p.title,
      status: p.status,
      sku: v.sku,
      size: v.size,
      color: v.color,
      price: v.price,
      stock: v.stock
    }))
  );

  const filtered = rows
    .filter((r) => {
      if (lowStockOnly && r.stock >= LOW_STOCK) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.productTitle.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.color.toLowerCase().includes(q) || r.size.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.productTitle.localeCompare(b.productTitle);
      else if (sortKey === "totalStock") cmp = a.stock - b.stock;
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function updateLocalStock(productId: string, sku: string, newStock: number) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId ? p : {
          ...p,
          variants: p.variants.map((v) => v.sku === sku ? { ...v, stock: newStock } : v)
        }
      )
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  async function handleBulkUpload() {
    if (!csvText.trim()) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await api.post<{ data: { updated: number; skipped: string[] } }>("/api/v1/admin/inventory/bulk-stock", { csv: csvText });
      setUploadResult(res.data);
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
      fetchInventory();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Bulk upload failed");
    } finally {
      setUploading(false);
    }
  }

  const totalVariants = rows.length;
  const outOfStock = rows.filter((r) => r.stock === 0).length;
  const lowStock = rows.filter((r) => r.stock > 0 && r.stock < LOW_STOCK).length;

  return (
    <div>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1>Inventory</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {totalVariants} variants · {outOfStock} out of stock · {lowStock} low
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={fetchInventory}
          style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total variants", value: totalVariants, color: "var(--accent)" },
          { label: "Out of stock", value: outOfStock, color: "#f87171" },
          { label: "Low stock (< 5)", value: lowStock, color: "#fbbf24" }
        ].map((t) => (
          <div key={t.label} style={{ padding: "1rem", borderRadius: 14, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.label}</p>
            <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800, color: t.color }}>{t.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search product, SKU, color…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "0.55rem 0.85rem", borderRadius: 10,
            border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)",
            color: "var(--text)", fontSize: "0.88rem"
          }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.83rem", color: "var(--text-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[
                  { key: "title" as SortKey, label: "Product" },
                  { key: null, label: "SKU" },
                  { key: null, label: "Size" },
                  { key: null, label: "Color" },
                  { key: null, label: "Price" },
                  { key: "totalStock" as SortKey, label: "Stock" },
                  { key: "status" as SortKey, label: "Status" }
                ].map(({ key, label }) => (
                  <th
                    key={label}
                    onClick={key ? () => toggleSort(key) : undefined}
                    style={{
                      padding: "0.6rem 0.75rem", textAlign: "left",
                      fontWeight: 600, color: "var(--text-muted)", fontSize: "0.75rem",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      cursor: key ? "pointer" : "default",
                      userSelect: "none"
                    }}
                  >
                    {label} {key && <SortIcon k={key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No variants match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.sku}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: row.stock === 0 ? "rgba(239,68,68,0.04)" : row.stock < LOW_STOCK ? "rgba(245,158,11,0.03)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>{row.productTitle}</td>
                    <td style={{ padding: "0.6rem 0.75rem", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-muted)" }}>{row.sku}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{row.size}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{row.color}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{formatCurrency(row.price)}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <InlineStockEditor
                          productId={row.productId}
                          sku={row.sku}
                          current={row.stock}
                          onSaved={(n) => updateLocalStock(row.productId, row.sku, n)}
                        />
                        <StockBadge stock={row.stock} />
                      </div>
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600,
                        background: row.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)",
                        color: row.status === "active" ? "#4ade80" : "var(--text-muted)"
                      }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Bulk CSV upload (T5) ── */}
      <div style={{ marginTop: "2.5rem", padding: "1.5rem", border: "1px solid var(--border)", borderRadius: 16, background: "rgba(255,255,255,0.02)" }}>
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 700 }}>Bulk stock update</h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.83rem", color: "var(--text-muted)" }}>
          Upload a CSV with columns <code>sku,stock</code> to restock multiple variants at once.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            style={{ fontSize: "0.83rem", color: "var(--text-muted)", cursor: "pointer" }}
          />
        </div>

        {csvText && (
          <div style={{ marginBottom: "0.75rem" }}>
            <pre style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "0.75rem", fontSize: "0.78rem",
              maxHeight: 160, overflowY: "auto", color: "var(--text-muted)"
            }}>
              {csvText.slice(0, 500)}{csvText.length > 500 ? "\n…" : ""}
            </pre>
          </div>
        )}

        <button
          onClick={handleBulkUpload}
          disabled={!csvText.trim() || uploading}
          style={{
            padding: "0.65rem 1.5rem", borderRadius: 999, fontWeight: 700, fontSize: "0.88rem",
            background: csvText.trim() ? "linear-gradient(135deg, #38bdf8, #8b5cf6)" : "rgba(255,255,255,0.07)",
            color: csvText.trim() ? "#0b1020" : "var(--text-muted)",
            cursor: csvText.trim() ? "pointer" : "not-allowed", border: "none",
            opacity: uploading ? 0.6 : 1
          }}
        >
          {uploading ? "Uploading…" : "Upload & apply"}
        </button>

        {uploadResult && (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", fontSize: "0.85rem" }}>
            ✓ Updated <strong>{uploadResult.updated}</strong> variant(s).
            {uploadResult.skipped.length > 0 && (
              <span style={{ color: "#fbbf24" }}> Skipped unknown SKUs: {uploadResult.skipped.join(", ")}</span>
            )}
          </div>
        )}

        <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Example CSV format:<br />
          <code>sku,stock</code><br />
          <code>OVERSIZED-L-BLACK,50</code><br />
          <code>BOXY-M-WHITE,25</code>
        </p>
      </div>
    </div>
  );
}
