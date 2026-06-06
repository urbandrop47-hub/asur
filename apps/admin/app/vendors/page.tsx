"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type VendorStat = {
  vendorId: string;
  pending: number;
  in_progress: number;
  ready_to_ship: number;
  completed: number;
  total: number;
};

function StatPill({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" }}>
      <span style={{
        fontWeight: 800, fontSize: "1.2rem", color,
        fontVariantNumeric: "tabular-nums"
      }}>
        {value}
      </span>
      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </span>
    </div>
  );
}

export default function VendorPerformancePage() {
  const [vendors, setVendors] = useState<VendorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ data: { vendors: VendorStat[] } }>("/api/v1/admin/vendor-performance")
      .then((r) => setVendors(r.data.vendors ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Vendor Performance</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Task breakdown per vendor
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); setError(false); api.get<{ data: { vendors: VendorStat[] } }>("/api/v1/admin/vendor-performance").then((r) => setVendors(r.data.vendors ?? [])).catch(() => setError(true)).finally(() => setLoading(false)); }}
          style={{ padding: "0.38rem 0.75rem", borderRadius: 999, fontSize: "0.78rem", border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit" }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
        </div>
      ) : error ? (
        <div className="empty-state">
          <h2>Failed to load vendor data</h2>
          <p>Check that the backend is running and you are authenticated.</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <h2>No vendor tasks yet</h2>
          <p>Vendor tasks are created automatically when orders are paid.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {vendors.map((v) => {
            const completionRate = v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0;
            return (
              <div key={v.vendorId} className="table-card" style={{ padding: "1.1rem 1.35rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  {/* Vendor ID */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
                      {v.vendorId === "unassigned" ? "— Unassigned" : v.vendorId}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <div style={{ flex: 1, maxWidth: 200, height: 5, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 999,
                          width: `${completionRate}%`,
                          background: completionRate === 100 ? "var(--success)" : "linear-gradient(90deg, #38bdf8, #818cf8)",
                          transition: "width 500ms ease"
                        }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>
                        {completionRate}% done
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "flex", gap: "1.75rem", flexShrink: 0 }}>
                    <StatPill value={v.pending}       color="var(--warning)"             label="Pending" />
                    <StatPill value={v.in_progress}   color="#38bdf8"                    label="In progress" />
                    <StatPill value={v.ready_to_ship} color="#a78bfa"                    label="Ready" />
                    <StatPill value={v.completed}     color="var(--success)"             label="Shipped" />
                    <StatPill value={v.total}         color="var(--text)"                label="Total" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
