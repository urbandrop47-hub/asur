"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Subscriber = {
  _id: string;
  email: string;
  source: string;
  subscribedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
};

type Stats = {
  total: number;
  confirmed: number;
  unsubscribed: number;
  pending: number;
};

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  async function fetchData(p = 1) {
    setLoading(true);
    try {
      const [subsRes, statsRes] = await Promise.all([
        api.get<{ data: Subscriber[]; total: number; page: number }>(`/api/v1/admin/newsletter/subscribers?page=${p}&limit=${limit}`),
        api.get<{ data: Stats }>("/api/v1/admin/newsletter/stats"),
      ]);
      setSubscribers(subsRes.data ?? []);
      setTotal(subsRes.total ?? 0);
      setStats(statsRes.data ?? null);
      setPage(p);
    } catch {
      // handled by loading state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchData(); }, []);

  function exportCsv() {
    const rows = [["Email", "Source", "Subscribed At", "Confirmed At"]];
    subscribers.forEach((s) => {
      rows.push([
        s.email,
        s.source,
        new Date(s.subscribedAt).toLocaleDateString("en-IN"),
        s.confirmedAt ? new Date(s.confirmedAt).toLocaleDateString("en-IN") : "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asur-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: "2rem", maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 800 }}>Newsletter</h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Confirmed subscribers only — double opt-in</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          style={{
            padding: "0.65rem 1.25rem", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600,
            background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "var(--text)",
            cursor: "pointer",
          }}
        >
          Export CSV
        </button>
      </div>

      {/* KPI tiles */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total", value: stats.total },
            { label: "Confirmed", value: stats.confirmed },
            { label: "Pending", value: stats.pending },
            { label: "Unsubscribed", value: stats.unsubscribed },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.1rem 1.25rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{label}</p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
                {["Email", "Source", "Subscribed", "Confirmed"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} style={{ padding: "0.75rem 1rem" }}>
                        <div className="skeleton skeleton-line" style={{ height: 14, width: j === 0 ? "70%" : "50%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No confirmed subscribers yet
                  </td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "var(--f-mono)", fontSize: "0.8rem" }}>{s.email}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600, background: "rgba(249,115,22,0.1)", color: "#f97316", textTransform: "capitalize" }}>
                        {s.source}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      {new Date(s.subscribedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      {s.confirmedAt
                        ? new Date(s.confirmedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {total} subscriber{total !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => fetchData(page - 1)}
                disabled={page <= 1}
                style={{ padding: "0.45rem 0.85rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1, fontSize: "0.82rem" }}
              >
                ← Prev
              </button>
              <span style={{ padding: "0.45rem 0.75rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => fetchData(page + 1)}
                disabled={page >= totalPages}
                style={{ padding: "0.45rem 0.85rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1, fontSize: "0.82rem" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
