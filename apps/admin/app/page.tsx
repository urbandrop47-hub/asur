"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@asur/utils";
import { api } from "../lib/api";
import { readAdminToken } from "../lib/auth-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type Analytics = {
  gmv: { d7: number; d30: number; d7Change: number; d30Change: number };
  orders: { d7: number; d30: number; d7Change: number; d30Change: number };
  aov: { d30: number; d30Change: number };
  topProducts: Array<{ productId: string; title: string; revenue: number; units: number }>;
  generatedAt: string;
};

type ChartDay = { day: string; revenue: number; orders: number };

// ─── KPI Tile ────────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  sub,
  change,
  accent = false
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number;
  accent?: boolean;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div style={{
      padding: "1.25rem 1.35rem",
      borderRadius: 16,
      border: `1px solid ${accent ? "rgba(56,189,248,0.25)" : "var(--border)"}`,
      background: accent ? "rgba(56,189,248,0.05)" : "rgba(255,255,255,0.02)",
      display: "flex", flexDirection: "column", gap: "0.35rem"
    }}>
      <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: accent ? "var(--accent)" : "var(--text)" }}>
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {change !== undefined && (
          <span style={{
            fontSize: "0.72rem", fontWeight: 700, padding: "1px 7px", borderRadius: 999,
            background: up ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            color: up ? "var(--success)" : "var(--danger)"
          }}>
            {up ? "▲" : "▼"} {Math.abs(change)}% vs prev period
          </span>
        )}
        {sub && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─── Revenue Bar Chart (pure SVG, no deps) ───────────────────────────────────

function RevenueChart({ data }: { data: ChartDay[] }) {
  const W = 720;
  const H = 160;
  const PAD = { top: 12, right: 8, bottom: 28, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const barW = Math.max(2, chartW / data.length - 2);
  const gap = (chartW - barW * data.length) / (data.length - 1 || 1);

  // Show only every 5th date label to avoid crowding
  const labelEvery = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} aria-label="30-day revenue chart">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Zero line */}
      <line
        x1={PAD.left} y1={PAD.top + chartH}
        x2={PAD.left + chartW} y2={PAD.top + chartH}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1"
      />
      {/* Bars */}
      {data.map((d, i) => {
        const barH = d.revenue > 0 ? Math.max(2, (d.revenue / maxRev) * chartH) : 0;
        const x = PAD.left + i * (barW + gap);
        const y = PAD.top + chartH - barH;
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={barW} height={barH} rx={2} fill="url(#barGrad)" opacity={d.revenue > 0 ? 1 : 0.15} />
            {/* Tooltip on hover via title */}
            {d.revenue > 0 && (
              <title>{d.day}: ₹{d.revenue.toLocaleString("en-IN")} ({d.orders} order{d.orders !== 1 ? "s" : ""})</title>
            )}
            {/* Date label */}
            {i % labelEvery === 0 && (
              <text
                x={x + barW / 2} y={H - 6}
                textAnchor="middle" fontSize="9" fill="rgba(246,241,234,0.35)"
                fontFamily="system-ui, sans-serif"
              >
                {d.day.slice(5)} {/* MM-DD */}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Top Products Table ───────────────────────────────────────────────────────

function TopProductsTable({ products }: { products: Analytics["topProducts"] }) {
  if (products.length === 0) {
    return <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>No paid orders in the last 30 days.</p>;
  }
  const maxRev = products[0]?.revenue ?? 1;
  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {products.map((p, i) => (
        <div key={p.productId} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            background: i === 0 ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.05)",
            fontSize: "0.7rem", fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--text-muted)", flexShrink: 0
          }}>
            {i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
              <Link
                href={`/products?q=${encodeURIComponent(p.title)}`}
                style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}
              >
                {p.title}
              </Link>
              <span style={{ fontSize: "0.83rem", fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>
                {formatCurrency(p.revenue)}
              </span>
            </div>
            {/* Revenue bar */}
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${Math.round((p.revenue / maxRev) * 100)}%`,
                background: "linear-gradient(90deg, #38bdf8, #8b5cf6)"
              }} />
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.units} unit{p.units !== 1 ? "s" : ""} sold</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CSV Export (T6) ─────────────────────────────────────────────────────────

function ExportButton() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const token = readAdminToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const resp = await fetch(`${baseUrl}/api/v1/admin/analytics/export-csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asur-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      console.error("CSV export failed", e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      style={{
        padding: "0.5rem 1rem", borderRadius: 999, fontSize: "0.82rem", fontWeight: 600,
        border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)",
        color: "var(--text-muted)", cursor: exporting ? "wait" : "pointer",
        display: "flex", alignItems: "center", gap: 6
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
        <path d="M6.5 1v8M3 7l3.5 3.5L10 7M1 12h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {exporting ? "Exporting…" : "Export CSV"}
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [chart, setChart] = useState<ChartDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d">("30d");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<{ data: Analytics }>("/api/v1/admin/analytics"),
      api.get<{ data: { chart: ChartDay[] } }>("/api/v1/admin/analytics/revenue-chart")
    ])
      .then(([a, c]) => {
        setAnalytics(a.data);
        setChart(c.data.chart);
      })
      .catch((e: Error) => setError(e.message ?? "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const gmv = analytics ? (period === "7d" ? analytics.gmv.d7 : analytics.gmv.d30) : 0;
  const gmvChange = analytics ? (period === "7d" ? analytics.gmv.d7Change : analytics.gmv.d30Change) : 0;
  const orders = analytics ? (period === "7d" ? analytics.orders.d7 : analytics.orders.d30) : 0;
  const ordersChange = analytics ? (period === "7d" ? analytics.orders.d7Change : analytics.orders.d30Change) : 0;
  const aov = analytics?.aov.d30 ?? 0;
  const aovChange = analytics?.aov.d30Change ?? 0;

  // Chart slice for 7d vs 30d
  const chartData = period === "7d" ? chart.slice(-7) : chart;
  const chartTotal = chartData.reduce((s, d) => s + d.revenue, 0);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.2rem", fontSize: "1.6rem", fontWeight: 800 }}>Dashboard</h1>
          {analytics && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Last updated {new Date(analytics.generatedAt).toLocaleTimeString("en-IN")}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Period toggle */}
          <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: 2 }}>
            {(["7d", "30d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "0.3rem 0.85rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
                  background: period === p ? "rgba(56,189,248,0.15)" : "transparent",
                  color: period === p ? "var(--accent)" : "var(--text-muted)",
                  border: period === p ? "1px solid rgba(56,189,248,0.3)" : "1px solid transparent",
                  cursor: "pointer"
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            style={{ padding: "0.38rem 0.75rem", borderRadius: 999, fontSize: "0.78rem", border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", cursor: "pointer" }}
          >
            ↻ Refresh
          </button>
          <ExportButton />
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          {error} — check backend is running.
        </div>
      )}

      {/* KPI tiles */}
      {loading ? (
        <div className="kpi-grid" style={{ marginBottom: "1.75rem" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <div className="kpi-grid" style={{ marginBottom: "1.75rem" }}>
          <KpiTile
            label={`GMV (${period})`}
            value={formatCurrency(gmv)}
            change={gmvChange}
            accent
          />
          <KpiTile
            label={`Orders (${period})`}
            value={orders.toString()}
            change={ordersChange}
          />
          <KpiTile
            label="AOV (30d)"
            value={aov > 0 ? formatCurrency(aov) : "—"}
            change={aovChange}
            sub="avg order value"
          />
        </div>
      )}

      {/* Revenue chart */}
      <div style={{ padding: "1.25rem 1.35rem", borderRadius: 16, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.1rem", fontSize: "0.9rem", fontWeight: 700 }}>Revenue — last {period === "7d" ? "7" : "30"} days</h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {loading ? "Loading…" : `${formatCurrency(chartTotal)} total`}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
        ) : chart.length > 0 ? (
          <RevenueChart data={chartData} />
        ) : (
          <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No revenue data yet
          </div>
        )}
      </div>

      {/* Bottom row: top products + quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Top products */}
        <div style={{ padding: "1.25rem 1.35rem", borderRadius: 16, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700 }}>Top products (30d)</h2>
            <Link href="/products" style={{ fontSize: "0.75rem", color: "var(--accent)" }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display: "grid", gap: "0.6rem" }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
            </div>
          ) : (
            <TopProductsTable products={analytics?.topProducts ?? []} />
          )}
        </div>

        {/* Quick links + recent activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { href: "/orders", icon: "◫", label: "Orders", sub: `${analytics?.orders.d30 ?? "—"} in last 30d` },
            { href: "/inventory", icon: "⊞", label: "Inventory", sub: "Manage stock levels" },
            { href: "/coupons", icon: "%", label: "Coupons", sub: "Discount codes" },
            { href: "/reviews", icon: "★", label: "Reviews", sub: "Moderation queue" }
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                padding: "0.85rem 1rem", borderRadius: 12, border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: "0.85rem",
                transition: "border-color 0.15s, background 0.15s"
              }}>
                <span style={{ fontSize: "1.1rem", width: 28, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.sub}</p>
                </div>
                <svg style={{ marginLeft: "auto", opacity: 0.3, flexShrink: 0 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
