"use client";

import { useEffect, useState } from "react";

type SizeChartRow = {
  size: string;
  chest: number;
  waist: number;
  hip: number;
  length: number;
};

type SizeChart = {
  category: string;
  unit: "cm" | "in";
  rows: SizeChartRow[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function findBestSize(rows: SizeChartRow[], chest: number, waist: number): string | null {
  if (!chest && !waist) return null;
  let best: SizeChartRow | null = null;
  let bestDiff = Infinity;
  for (const row of rows) {
    const diff =
      (chest ? Math.abs(row.chest - chest) : 0) +
      (waist ? Math.abs(row.waist - waist) : 0);
    if (diff < bestDiff) { bestDiff = diff; best = row; }
  }
  return best?.size ?? null;
}

export function SizeGuideModal({
  category,
  onClose
}: {
  category: string;
  onClose: () => void;
}) {
  const [chart, setChart] = useState<SizeChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"chart" | "finder">("chart");

  // Measurement finder state
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const recommended = chart ? findBestSize(chart.rows, Number(chest) || 0, Number(waist) || 0) : null;

  // Body scroll lock + escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = prev; };
  }, [onClose]);

  useEffect(() => {
    const slug = category.toLowerCase().replace(/\s+/g, "-");
    fetch(`${API_BASE}/api/v1/size-guide/${slug}`)
      .then((r) => r.json())
      .then((j) => setChart(j.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  const unit = chart?.unit ?? "cm";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 7500, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0.5rem" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: "var(--surface, #1a1510)",
          border: "1px solid var(--border)",
          borderRadius: "20px 20px 0 0",
          padding: "1.5rem 1.25rem 2rem",
          maxHeight: "85vh", overflowY: "auto",
          animation: "slideUp 0.25s cubic-bezier(0.22,1,0.36,1)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Size Guide</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "0.25rem" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: 3, marginBottom: "1.25rem" }}>
          {(["chart", "finder"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "0.4rem 0.75rem", borderRadius: 999, fontSize: "0.83rem", fontWeight: 600, cursor: "pointer",
                background: tab === t ? "rgba(249,115,22,0.15)" : "transparent",
                color: tab === t ? "var(--accent)" : "var(--text-muted)",
                border: tab === t ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent"
              }}
            >
              {t === "chart" ? "Size chart" : "Find my size"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
          </div>
        ) : !chart ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Size chart not available for this category.</p>
        ) : tab === "chart" ? (
          <>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Measurements in <strong>{unit}</strong>. For the best fit, measure over a light base layer.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    {["Size", `Chest (${unit})`, `Waist (${unit})`, `Hip (${unit})`, `Length (${unit})`].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.6rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((row, i) => (
                    <tr key={row.size} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "0.6rem 0.6rem", fontWeight: 700, color: "var(--accent)" }}>{row.size}</td>
                      <td style={{ padding: "0.6rem 0.6rem" }}>{row.chest}</td>
                      <td style={{ padding: "0.6rem 0.6rem" }}>{row.waist}</td>
                      <td style={{ padding: "0.6rem 0.6rem" }}>{row.hip}</td>
                      <td style={{ padding: "0.6rem 0.6rem" }}>{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Between sizes? Size up for a relaxed fit or choose the smaller size for a fitted look. ASUR's Oversized styles are intentionally cut 2 sizes larger.
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Enter your measurements (in {unit}) and we'll suggest the best size for you.
            </p>
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                  Chest ({unit}) — measure across widest point
                </label>
                <input
                  type="number"
                  min={60} max={140}
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  placeholder={`e.g. ${chart.rows[2]?.chest ?? 92}`}
                  style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "var(--text)", fontSize: "0.92rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                  Waist ({unit}) — measure at natural waist
                </label>
                <input
                  type="number"
                  min={50} max={120}
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder={`e.g. ${chart.rows[2]?.waist ?? 76}`}
                  style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "var(--text)", fontSize: "0.92rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {recommended ? (
              <div style={{ padding: "1.25rem", borderRadius: 14, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", textAlign: "center" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your recommended size</p>
                <p style={{ margin: 0, fontSize: "2.5rem", fontWeight: 900, color: "#f97316", lineHeight: 1 }}>{recommended}</p>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {chart.rows.find((r) => r.size === recommended)
                    ? `Chest ${chart.rows.find((r) => r.size === recommended)!.chest} · Waist ${chart.rows.find((r) => r.size === recommended)!.waist} ${unit}`
                    : ""}
                </p>
              </div>
            ) : (
              <div style={{ padding: "1rem", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Enter at least one measurement above</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
