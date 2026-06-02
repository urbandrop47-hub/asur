"use client";

import { useEffect, useState } from "react";
import type { Return, ReturnStatus } from "@asur/types";
import { api } from "../../lib/api";

const STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  refunded: "Refunded"
};

const STATUS_COLOR: Record<ReturnStatus, string> = {
  requested: "#f97316",
  approved: "#3b82f6",
  rejected: "#ef4444",
  refunded: "#22c55e"
};

type FilterTab = "all" | ReturnStatus;
const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "requested", label: "Requested" },
  { key: "approved", label: "Approved" },
  { key: "refunded", label: "Refunded" },
  { key: "rejected", label: "Rejected" }
];

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("requested");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  function fetchReturns(tab: FilterTab) {
    setLoading(true);
    const qs = tab !== "all" ? `?status=${tab}` : "";
    api
      .get<{ data: Return[] }>(`/api/v1/admin/returns${qs}`)
      .then((r) => setReturns(r.data))
      .catch((e: Error) => setGlobalError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchReturns(activeTab); }, [activeTab]);

  async function handleDecide(id: string, action: "approve" | "reject") {
    setDeciding(id);
    try {
      await api.patch(`/api/v1/admin/returns/${id}`, { action, adminNote: adminNote[id] ?? "" });
      fetchReturns(activeTab);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 800 }}>Returns</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>Review and process customer return requests</p>
      </div>

      {globalError && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {globalError}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.45rem 1rem", borderRadius: 999, border: "1px solid",
              borderColor: activeTab === tab.key ? "var(--accent)" : "var(--border)",
              background: activeTab === tab.key ? "rgba(249,115,22,0.12)" : "transparent",
              color: activeTab === tab.key ? "var(--accent)" : "var(--text-muted)",
              fontWeight: 600, fontSize: "0.82rem", cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : returns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          No returns found
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {returns.map((ret) => {
            const isExpanded = expanded === ret.id;
            return (
              <div key={ret.id} style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                {/* Row */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.1rem", cursor: "pointer" }}
                  onClick={() => setExpanded(isExpanded ? null : ret.id)}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: STATUS_COLOR[ret.status]
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>#{ret.orderNumber}</span>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                        background: `${STATUS_COLOR[ret.status]}20`, color: STATUS_COLOR[ret.status]
                      }}>
                        {STATUS_LABEL[ret.status]}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {ret.items.length} item{ret.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ret.reason}
                    </p>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {ret.refundAmount != null && (
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>
                        ₹{ret.refundAmount.toLocaleString("en-IN")}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {new Date(ret.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>

                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transition: "transform 200ms", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-muted)" }}>
                    <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.1rem", display: "grid", gap: "1rem" }}>
                    {/* Items */}
                    <div>
                      <p style={{ margin: "0 0 0.6rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Return items</p>
                      <div style={{ display: "grid", gap: "0.35rem" }}>
                        {ret.items.map((item) => (
                          <div key={item.variantSku} style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
                            <span style={{ fontFamily: "var(--f-mono)", color: "var(--text-muted)" }}>{item.variantSku}</span>
                            <span>×{item.quantity}</span>
                            <span style={{ color: "var(--text-muted)" }}>— {item.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
                      {[
                        { label: "Return ID", value: ret.id },
                        { label: "Customer ID", value: ret.customerId },
                        ...(ret.refundId ? [{ label: "Refund ref", value: ret.refundId }] : []),
                        ...(ret.adminNote ? [{ label: "Admin note", value: ret.adminNote }] : [])
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                          <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", fontFamily: "var(--f-mono)", wordBreak: "break-all" }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action panel — only for requested */}
                    {ret.status === "requested" && (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "grid", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>Admin note (optional)</label>
                          <input
                            value={adminNote[ret.id] ?? ""}
                            onChange={(e) => setAdminNote((n) => ({ ...n, [ret.id]: e.target.value }))}
                            placeholder="Reason for decision..."
                            style={{
                              width: "100%", boxSizing: "border-box",
                              padding: "0.6rem 0.85rem", borderRadius: 10, fontSize: "0.85rem",
                              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                              color: "var(--text)"
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "0.65rem" }}>
                          <button
                            onClick={() => handleDecide(ret.id, "approve")}
                            disabled={deciding === ret.id}
                            style={{
                              flex: 1, padding: "0.7rem", borderRadius: 10, border: "none", cursor: "pointer",
                              background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 700, fontSize: "0.85rem",
                              opacity: deciding === ret.id ? 0.6 : 1
                            }}
                          >
                            {deciding === ret.id ? "Processing…" : "Approve & Refund"}
                          </button>
                          <button
                            onClick={() => handleDecide(ret.id, "reject")}
                            disabled={deciding === ret.id}
                            style={{
                              flex: 1, padding: "0.7rem", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer",
                              background: "transparent", color: "#ef4444", fontWeight: 700, fontSize: "0.85rem",
                              opacity: deciding === ret.id ? 0.6 : 1
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
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
