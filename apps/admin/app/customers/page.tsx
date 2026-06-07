"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";

type CustomerRow = {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  createdAt: string;
  orderCount: number;
  ltv: number;
  lastOrderAt: string | null;
  tier: "Bronze" | "Silver" | "Gold";
  loyaltyPoints: number;
  segment: "top" | "active" | "lapsed";
};

type Segment = "all" | "active" | "lapsed" | "top";
const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "lapsed", label: "Lapsed" },
  { key: "top", label: "Top (LTV ≥ ₹5k)" }
];

const TIER_COLOR: Record<string, string> = {
  Bronze: "#cd7f32",
  Silver: "#9ca3af",
  Gold: "#f59e0b"
};

const SEG_COLOR: Record<string, string> = {
  top: "#f59e0b",
  active: "#22c55e",
  lapsed: "#ef4444"
};

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [tier, setTier] = useState("");
  const [showCampaign, setShowCampaign] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [sending, setSending] = useState(false);
  const [campaignResult, setCampaignResult] = useState<{ sent: number; failed: number } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limit = 50;

  function fetchCustomers(p = 1, q = search, seg = segment, t = tier) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (q) params.set("search", q);
    if (seg !== "all") params.set("segment", seg);
    if (t) params.set("tier", t);
    api
      .get<{ data: CustomerRow[]; total: number }>(`/api/v1/admin/customers?${params}`)
      .then((r) => {
        setCustomers(r.data ?? []);
        setTotal(r.total ?? 0);
        setPage(p);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCustomers(); }, []);

  function handleSearch(val: string) {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchCustomers(1, val, segment, tier), 350);
  }

  function handleSegment(seg: Segment) {
    setSegment(seg);
    fetchCustomers(1, search, seg, tier);
  }

  function handleTier(t: string) {
    setTier(t);
    fetchCustomers(1, search, segment, t);
  }

  async function sendCampaign() {
    if (!campaignSubject.trim() || !campaignBody.trim()) return;
    setSending(true);
    setCampaignResult(null);
    try {
      const result = await api.post<{ sent: number; failed: number }>(
        "/api/v1/admin/customers/email-segment",
        { segment, tier: tier || undefined, subject: campaignSubject, body: campaignBody }
      );
      setCampaignResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Campaign failed");
    } finally {
      setSending(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: "2rem", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Customers</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {total.toLocaleString()} customers total
          </p>
        </div>
        <button
          onClick={() => { setShowCampaign(!showCampaign); setCampaignResult(null); }}
          style={{
            padding: "0.55rem 1.2rem", borderRadius: 999, border: "1px solid var(--border)",
            background: showCampaign ? "rgba(139,92,246,0.15)" : "transparent",
            color: "var(--text)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600
          }}
        >
          ✉ Email segment
        </button>
      </div>

      {/* Campaign panel */}
      {showCampaign && (
        <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.9rem" }}>
            Email campaign — {segment === "all" ? "all" : segment} customers{tier ? ` · ${tier} tier` : ""}
          </p>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <input
              value={campaignSubject}
              onChange={(e) => setCampaignSubject(e.target.value)}
              placeholder="Subject line"
              style={{ padding: "0.6rem 0.9rem", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", fontFamily: "inherit", fontSize: "0.88rem" }}
            />
            <textarea
              value={campaignBody}
              onChange={(e) => setCampaignBody(e.target.value)}
              placeholder="Email body (plain text, ~2–3 sentences)"
              rows={4}
              style={{ padding: "0.6rem 0.9rem", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", fontFamily: "inherit", fontSize: "0.88rem", resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
            <button
              onClick={sendCampaign}
              disabled={sending || !campaignSubject.trim() || !campaignBody.trim()}
              style={{
                padding: "0.55rem 1.2rem", borderRadius: 999, fontWeight: 700,
                background: "linear-gradient(135deg,#8b5cf6,#38bdf8)", color: "#0b1020",
                border: "none", cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1,
                fontSize: "0.85rem"
              }}
            >
              {sending ? "Sending…" : "Send campaign"}
            </button>
            {campaignResult && (
              <span style={{ fontSize: "0.82rem", color: "#22c55e" }}>
                Sent to {campaignResult.sent} recipients{campaignResult.failed > 0 ? ` (${campaignResult.failed} failed)` : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search name, email, phone…"
          style={{
            flex: "1 1 220px", minWidth: 180, padding: "0.55rem 0.9rem", borderRadius: 999,
            border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)",
            color: "var(--text)", fontFamily: "inherit", fontSize: "0.85rem"
          }}
        />
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              onClick={() => handleSegment(s.key)}
              style={{
                padding: "0.4rem 0.85rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600,
                border: "1px solid var(--border)", cursor: "pointer",
                background: segment === s.key ? "rgba(56,189,248,0.15)" : "transparent",
                color: segment === s.key ? "#38bdf8" : "var(--text-muted)"
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <select
          value={tier}
          onChange={(e) => handleTier(e.target.value)}
          style={{
            padding: "0.4rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.82rem", fontFamily: "inherit"
          }}
        >
          <option value="">All tiers</option>
          <option value="Bronze">Bronze</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
        </select>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.85rem", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
              <th style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>Customer</th>
              <th style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>Orders</th>
              <th style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>LTV</th>
              <th style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>Tier</th>
              <th style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>Segment</th>
              <th style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>Last order</th>
              <th style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>Joined</th>
              <th style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No customers found</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "0.65rem 0.75rem" }}>
                  <div style={{ fontWeight: 600 }}>{c.name ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{c.email ?? c.phoneNumber ?? "—"}</div>
                </td>
                <td style={{ padding: "0.65rem 0.75rem" }}>{c.orderCount}</td>
                <td style={{ padding: "0.65rem 0.75rem", fontWeight: 600 }}>{fmt(c.ltv)}</td>
                <td style={{ padding: "0.65rem 0.75rem" }}>
                  <span style={{ color: TIER_COLOR[c.tier], fontWeight: 600, fontSize: "0.8rem" }}>{c.tier}</span>
                </td>
                <td style={{ padding: "0.65rem 0.75rem" }}>
                  <span style={{
                    display: "inline-block", padding: "0.15rem 0.6rem", borderRadius: 999,
                    fontSize: "0.75rem", fontWeight: 700,
                    background: `${SEG_COLOR[c.segment]}22`,
                    color: SEG_COLOR[c.segment]
                  }}>
                    {c.segment}
                  </span>
                </td>
                <td style={{ padding: "0.65rem 0.75rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {c.lastOrderAt ? `${daysSince(c.lastOrderAt)}d ago` : "—"}
                </td>
                <td style={{ padding: "0.65rem 0.75rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "0.65rem 0.75rem" }}>
                  <Link
                    href={`/customers/${c.id}`}
                    style={{ fontSize: "0.8rem", color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1.5rem" }}>
          <button
            onClick={() => fetchCustomers(page - 1)}
            disabled={page <= 1}
            style={{ padding: "0.4rem 1rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: "0.85rem", color: "var(--text-muted)", padding: "0 0.5rem" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchCustomers(page + 1)}
            disabled={page >= totalPages}
            style={{ padding: "0.4rem 1rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
