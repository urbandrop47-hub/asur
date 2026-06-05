"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";

type AuditLog = {
  _id: string;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  diff?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
};

const ACTION_COLOR: Record<string, string> = {
  "product.create": "var(--success, #22c55e)",
  "product.update": "var(--accent)",
  "product.delete": "var(--danger, #ef4444)",
  "order.bulk-status": "var(--accent)",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  function load(q?: string) {
    setLoading(true);
    const qs = q ? `?search=${encodeURIComponent(q)}` : "";
    api
      .get<{ data: { logs: AuditLog[] } }>(`/api/v1/admin/audit-log${qs}`)
      .then((r) => setLogs(r.data?.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search.trim() || undefined);
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/settings" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>← Settings</Link>
        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>Audit Log</h1>
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)" }}>{logs.length} events</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action, resource, or admin…"
          style={{
            flex: 1, padding: "0.65rem 0.9rem", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
            color: "var(--text)", font: "inherit", fontSize: "0.9rem", outline: "none"
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.65rem 1.2rem", borderRadius: 10, border: "1px solid var(--border)",
            background: "transparent", color: "var(--text)", fontSize: "0.9rem",
            cursor: "pointer", fontFamily: "inherit"
          }}
        >Search</button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); load(); }}
            style={{
              padding: "0.65rem 0.9rem", borderRadius: 10, border: "none",
              background: "transparent", color: "var(--text-muted)", fontSize: "0.9rem",
              cursor: "pointer", fontFamily: "inherit"
            }}
          >Clear</button>
        )}
      </form>

      {loading ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10 }} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <h2>No audit events</h2>
          <p>{search ? "No events match your search." : "Admin mutations will appear here."}</p>
        </div>
      ) : (
        <div className="table-card">
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.7fr 1fr", gap: "0.75rem", padding: "0.6rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            {["Action", "Resource", "ID", "IP", "Time"].map((h) => (
              <span key={h} style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {logs.map((log) => {
            const isExpanded = expanded === log._id;
            const t = new Date(log.createdAt);
            const timeStr = t.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
            const color = ACTION_COLOR[log.action] ?? "var(--text-muted)";

            return (
              <div key={log._id}>
                <div
                  onClick={() => setExpanded(isExpanded ? null : log._id)}
                  style={{
                    display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.7fr 1fr",
                    gap: "0.75rem", padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid var(--border)", alignItems: "center",
                    cursor: log.diff ? "pointer" : "default"
                  }}
                >
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, fontFamily: "monospace", color }}>{log.action}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{log.resourceType}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.resourceId ? log.resourceId.slice(0, 12) + "…" : "—"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.ip ?? "—"}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{timeStr}</span>
                </div>

                {isExpanded && log.diff && (
                  <div style={{ padding: "0.75rem 1.25rem 0.75rem 2.5rem", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                    <p style={{ margin: "0 0 0.35rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Diff</p>
                    <pre style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {JSON.stringify(log.diff, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
