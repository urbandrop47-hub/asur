"use client";

import type { ProductVariant } from "@asur/types";
import { formatCurrency } from "@asur/utils";

type Props = {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
};

const empty = (): ProductVariant => ({ size: "", color: "", sku: "", stock: 0, price: 0 });

export function VariantEditor({ variants, onChange }: Props) {
  function update(i: number, field: keyof ProductVariant, value: string | number) {
    const next = variants.map((v, idx) => (idx === i ? { ...v, [field]: value } : v));
    onChange(next);
  }

  function addRow() {
    onChange([...variants, empty()]);
  }

  function removeRow(i: number) {
    onChange(variants.filter((_, idx) => idx !== i));
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem 0.6rem", borderRadius: 8, border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.82rem",
    fontFamily: "inherit", outline: "none", width: "100%"
  };

  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.7fr 0.9fr 0.9fr 32px", gap: "0.4rem", padding: "0 0.25rem" }}>
        {["Size", "Color", "SKU", "Stock", "Price (₹)", "Compare (₹)", ""].map((h) => (
          <span key={h} style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{h}</span>
        ))}
      </div>

      {variants.length === 0 && (
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", padding: "0.5rem 0.25rem" }}>
          No variants yet. Add one below.
        </p>
      )}

      {variants.map((v, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.7fr 0.9fr 0.9fr 32px", gap: "0.4rem", alignItems: "center" }}>
          <input style={inputStyle} value={v.size} placeholder="M" onChange={(e) => update(i, "size", e.target.value)} />
          <input style={inputStyle} value={v.color} placeholder="Black" onChange={(e) => update(i, "color", e.target.value)} />
          <input style={inputStyle} value={v.sku} placeholder="SKU-M-BLK" onChange={(e) => update(i, "sku", e.target.value)} />
          <input style={inputStyle} type="number" min="0" value={v.stock} onChange={(e) => update(i, "stock", Math.max(0, parseInt(e.target.value) || 0))} />
          <input style={inputStyle} type="number" min="0" value={v.price / 100} placeholder="0"
            onChange={(e) => update(i, "price", Math.round((parseFloat(e.target.value) || 0) * 100))} />
          <input style={inputStyle} type="number" min="0" value={(v.compareAtPrice ?? 0) / 100} placeholder="0"
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              update(i, "compareAtPrice", val > 0 ? Math.round(val * 100) : 0);
            }} />
          <button
            onClick={() => removeRow(i)}
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
        <button onClick={addRow} className="btn-ghost" style={{ fontSize: "0.82rem" }}>
          + Add variant
        </button>
        {variants.length > 0 && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {variants.length} variant{variants.length !== 1 ? "s" : ""} ·
            {" "}{variants.reduce((s, v) => s + v.stock, 0)} total stock ·
            {" "}{formatCurrency(Math.min(...variants.map((v) => v.price)))}–{formatCurrency(Math.max(...variants.map((v) => v.price)))}
          </span>
        )}
      </div>
    </div>
  );
}
