"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";

type CustomerNote = {
  id: string;
  note: string;
  createdBy: string;
  createdAt: string;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: { title: string; quantity: number }[];
};

type Profile = {
  user: {
    id: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    createdAt: string;
    emailPrefs?: { marketing: boolean };
  };
  orders: OrderRow[];
  ltv: number;
  orderCount: number;
  lastOrderAt: string | null;
  loyalty: { points: number; lifetimePoints: number; tier: string } | null;
  referral: { code: string; usedCount: number } | null;
  reviewCount: number;
  notes: CustomerNote[];
  segment: "top" | "active" | "lapsed";
};

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

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#f97316",
  paid: "#3b82f6",
  processing: "#3b82f6",
  packed: "#8b5cf6",
  shipped: "#38bdf8",
  delivered: "#22c55e",
  cancelled: "#ef4444"
};

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function initials(name?: string, email?: string) {
  if (name) return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return "?";
}

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  function fetchProfile() {
    setLoading(true);
    setError(null);
    api
      .get<{ data: Profile }>(`/api/v1/admin/customers/${id}`)
      .then((r) => setProfile(r.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (id) fetchProfile(); }, [id]);

  async function addNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    setNoteError(null);
    try {
      await api.post(
        `/api/v1/admin/customers/${id}/note`,
        { note: noteText.trim() }
      );
      setNoteText("");
      fetchProfile();
    } catch (e) {
      setNoteError(e instanceof Error ? e.message : "Failed to add note");
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>;
  }
  if (error || !profile) {
    return (
      <div style={{ padding: "2rem" }}>
        <Link href="/customers" style={{ color: "#38bdf8", fontSize: "0.85rem", textDecoration: "none" }}>← Back to customers</Link>
        <div style={{ marginTop: "1rem", color: "#ef4444" }}>{error ?? "Customer not found"}</div>
      </div>
    );
  }

  const { user, orders, ltv, orderCount, loyalty, referral, reviewCount, notes, segment } = profile;

  return (
    <div style={{ padding: "2rem", maxWidth: 900 }}>
      {/* Back */}
      <Link href="/customers" style={{ color: "#38bdf8", fontSize: "0.85rem", textDecoration: "none" }}>
        ← Back to customers
      </Link>

      {/* Profile header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", margin: "1.5rem 0" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#8b5cf6,#38bdf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.4rem", fontWeight: 800, color: "#0b1020"
        }}>
          {initials(user.name, user.email)}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>
            {user.name ?? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>No name</span>}
          </h1>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            {user.email ?? "—"}{user.phoneNumber ? ` · ${user.phoneNumber}` : ""}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
            <span style={{
              display: "inline-block", padding: "0.15rem 0.65rem", borderRadius: 999,
              fontSize: "0.75rem", fontWeight: 700,
              background: `${SEG_COLOR[segment]}22`, color: SEG_COLOR[segment]
            }}>
              {segment}
            </span>
            {loyalty && (
              <span style={{ fontSize: "0.78rem", color: TIER_COLOR[loyalty.tier], fontWeight: 700 }}>
                {loyalty.tier} tier
              </span>
            )}
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
        {[
          { label: "Total orders", value: String(orderCount) },
          { label: "Lifetime value", value: fmt(ltv) },
          { label: "Loyalty pts", value: loyalty ? String(loyalty.points) : "—" },
          { label: "Lifetime pts", value: loyalty ? String(loyalty.lifetimePoints) : "—" },
          { label: "Reviews", value: String(reviewCount) },
          { label: "Referrals sent", value: referral ? String(referral.usedCount) : "—" },
          { label: "Marketing email", value: user.emailPrefs?.marketing === false ? "Off" : "On" }
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.9rem 1rem"
          }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Referral code */}
      {referral && (
        <div style={{ marginBottom: "1.5rem", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "0.85rem 1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Referral code</span>
          <code style={{ fontFamily: "var(--font-mono,monospace)", fontWeight: 700, fontSize: "0.92rem", color: "#f59e0b" }}>{referral.code}</code>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{referral.usedCount} use{referral.usedCount !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Recent orders */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem" }}>Orders ({orderCount})</h2>
        {orders.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No orders yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Order</th>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Items</th>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Total</th>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.55rem 0.75rem" }}>
                      <Link href={`/orders/${o.id}`} style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td style={{ padding: "0.55rem 0.75rem", color: "var(--text-muted)" }}>
                      {o.items?.slice(0, 2).map((item, i) => (
                        <span key={i}>{item.title} ×{item.quantity}{i < Math.min(o.items.length, 2) - 1 ? ", " : ""}</span>
                      ))}
                      {o.items?.length > 2 && <span> +{o.items.length - 2} more</span>}
                    </td>
                    <td style={{ padding: "0.55rem 0.75rem", fontWeight: 600 }}>{fmt(o.total)}</td>
                    <td style={{ padding: "0.55rem 0.75rem" }}>
                      <span style={{
                        display: "inline-block", padding: "0.12rem 0.55rem", borderRadius: 999,
                        fontSize: "0.74rem", fontWeight: 700,
                        background: `${STATUS_COLOR[o.status] ?? "#6b7280"}22`,
                        color: STATUS_COLOR[o.status] ?? "#6b7280"
                      }}>
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "0.55rem 0.75rem", color: "var(--text-muted)" }}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Internal notes */}
      <section>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem" }}>Internal notes</h2>
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
            placeholder="Add a note about this customer…"
            maxLength={1000}
            style={{
              flex: 1, padding: "0.55rem 0.9rem", borderRadius: 8,
              border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)",
              color: "var(--text)", fontFamily: "inherit", fontSize: "0.85rem"
            }}
          />
          <button
            onClick={addNote}
            disabled={addingNote || !noteText.trim()}
            style={{
              padding: "0.55rem 1.1rem", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem",
              background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)",
              cursor: addingNote || !noteText.trim() ? "not-allowed" : "pointer",
              opacity: addingNote || !noteText.trim() ? 0.5 : 1
            }}
          >
            {addingNote ? "Adding…" : "Add"}
          </button>
        </div>
        {noteError && <p style={{ fontSize: "0.82rem", color: "#ef4444", margin: "0 0 0.75rem" }}>{noteError}</p>}
        {notes.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No notes yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {notes.map((n) => (
              <div key={n.id} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem 1rem"
              }}>
                <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6 }}>{n.note}</p>
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {n.createdBy} · {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
