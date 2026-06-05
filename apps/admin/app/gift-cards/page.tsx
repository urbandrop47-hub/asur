"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@asur/utils";
import { api } from "../../lib/api";

type GiftCard = {
  id: string;
  code: string;
  initialAmount: number;
  balance: number;
  purchasedBy?: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
};

type CreateForm = {
  amount: string;
  recipientEmail: string;
  recipientName: string;
  message: string;
  expiresAt: string;
};

const emptyCreate: CreateForm = {
  amount: "1000", recipientEmail: "", recipientName: "", message: "", expiresAt: ""
};

function formatCode(code: string) {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

function statusLabel(card: GiftCard): { label: string; color: string } {
  if (!card.isActive) return { label: "Deactivated", color: "#fb7185" };
  if (card.expiresAt && new Date(card.expiresAt) < new Date()) return { label: "Expired", color: "#fb7185" };
  if (card.balance === 0) return { label: "Used", color: "#888" };
  return { label: "Active", color: "#4ade80" };
}

function toDateInput(iso: string) {
  return iso ? iso.slice(0, 10) : "";
}

function exportCsv(cards: GiftCard[]) {
  const headers = ["Code", "Initial Amount", "Balance", "Recipient Email", "Recipient Name", "Status", "Expires At", "Created At", "Purchased By"];
  const rows = cards.map((c) => {
    const st = statusLabel(c);
    return [
      formatCode(c.code),
      c.initialAmount,
      c.balance,
      c.recipientEmail ?? "",
      c.recipientName ?? "",
      st.label,
      c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never",
      new Date(c.createdAt).toLocaleDateString("en-IN"),
      c.purchasedBy ?? ""
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gift-cards-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Balance Adjustment Modal ────────────────────────────────

function AdjustBalanceModal({
  card,
  onClose,
  onDone
}: {
  card: GiftCard;
  onClose: () => void;
  onDone: () => void;
}) {
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const deltaNum = parseInt(delta, 10) || 0;
  const preview = Math.max(0, card.balance + deltaNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (deltaNum === 0) { setErr("Enter a non-zero amount"); return; }
    if (!reason.trim()) { setErr("Reason is required"); return; }
    setSaving(true);
    setErr(null);
    try {
      await api.post(`/api/v1/admin/gift-cards/${card.id}/adjust-balance`, {
        delta: deltaNum,
        reason: reason.trim()
      });
      onDone();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Failed to adjust balance");
    } finally {
      setSaving(false);
    }
  }

  const iStyle = {
    width: "100%", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
    background: "rgba(255,255,255,0.06)", color: "#f6f1ea", padding: "0.6rem 0.75rem",
    font: "inherit", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#13131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 420 }}>
        <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "1rem" }}>Adjust Balance</p>
        <p style={{ margin: "0 0 1rem", fontSize: "0.83rem", color: "rgba(246,241,234,0.5)" }}>
          Card: <span style={{ fontFamily: "monospace", color: "#f97316" }}>{formatCode(card.code)}</span>
          {" · "}Current: <strong style={{ color: "#f6f1ea" }}>{formatCurrency(card.balance)}</strong>
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(246,241,234,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>
              Adjustment amount (₹, use negative to deduct)
            </label>
            <input
              ref={inputRef}
              style={iStyle}
              type="number"
              value={delta}
              onChange={(e) => { setDelta(e.target.value); setErr(null); }}
              placeholder="e.g. 200 or -100"
            />
            {deltaNum !== 0 && (
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: deltaNum > 0 ? "#4ade80" : "#fb7185" }}>
                New balance: {formatCurrency(preview)}
                {deltaNum < 0 && card.balance + deltaNum < 0 && " (capped at ₹0)"}
              </p>
            )}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(246,241,234,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>
              Reason *
            </label>
            <input
              style={iStyle}
              type="text"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErr(null); }}
              placeholder="e.g. CS credit for delayed order #ORD-123"
              maxLength={200}
            />
          </div>
          {err && <p style={{ margin: 0, fontSize: "0.8rem", color: "#fb7185" }}>{err}</p>}
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "0.55rem 1.1rem", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(246,241,234,0.6)", cursor: "pointer", fontSize: "0.85rem" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "0.55rem 1.25rem", borderRadius: 8, background: "#f97316", color: "#0a0a0f", border: "none", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: "0.85rem", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Expanded row detail ─────────────────────────────────────

function DetailRow({
  card,
  onAdjust,
  onResend,
  onToggleActive,
  onExpiryChange,
  actionPending
}: {
  card: GiftCard;
  onAdjust: () => void;
  onResend: () => void;
  onToggleActive: () => void;
  onExpiryChange: (iso: string) => void;
  actionPending: boolean;
}) {
  const [expiryInput, setExpiryInput] = useState(toDateInput(card.expiresAt));
  const [expiryDirty, setExpiryDirty] = useState(false);
  const [expiryMsg, setExpiryMsg] = useState<string | null>(null);

  // Sync if parent refreshes card data (e.g. after another save)
  useEffect(() => {
    if (!expiryDirty) {
      setExpiryInput(toDateInput(card.expiresAt));
    }
  }, [card.expiresAt, expiryDirty]);

  async function saveExpiry() {
    if (!expiryDirty) return;
    try {
      await onExpiryChange(expiryInput);
      setExpiryDirty(false);
      setExpiryMsg("Saved");
      setTimeout(() => setExpiryMsg(null), 1800);
    } catch {
      setExpiryMsg("Failed to save");
    }
  }

  const btnBase = {
    padding: "0.35rem 0.8rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600 as const,
    border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: actionPending ? "not-allowed" as const : "pointer" as const,
    opacity: actionPending ? 0.5 : 1
  };

  return (
    <tr>
      <td colSpan={8} style={{ padding: "0 1rem 1rem", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "1rem", paddingTop: "0.75rem" }}>

          {/* Meta */}
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(246,241,234,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</p>
            {card.message && <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(246,241,234,0.7)", fontStyle: "italic" }}>&ldquo;{card.message}&rdquo;</p>}
            {card.purchasedBy && <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(246,241,234,0.5)" }}>Buyer: <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{card.purchasedBy}</span></p>}
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(246,241,234,0.4)" }}>
              Issued {new Date(card.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          {/* Expiry editor */}
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(246,241,234,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expiry date</p>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <input
                type="date"
                value={expiryInput}
                onChange={(e) => { setExpiryInput(e.target.value); setExpiryDirty(true); setExpiryMsg(null); }}
                style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#f6f1ea", padding: "0.35rem 0.5rem", fontSize: "0.83rem", outline: "none", font: "inherit" }}
              />
              {expiryDirty && (
                <button
                  onClick={saveExpiry}
                  style={{ ...btnBase, color: "#4ade80", borderColor: "rgba(74,222,128,0.3)" }}
                >
                  Save
                </button>
              )}
            </div>
            {expiryMsg && <p style={{ margin: 0, fontSize: "0.75rem", color: expiryMsg === "Saved" ? "#4ade80" : "#fb7185" }}>{expiryMsg}</p>}
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gap: "0.5rem", alignContent: "start" }}>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(246,241,234,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              <button onClick={onAdjust} disabled={actionPending} style={{ ...btnBase, color: "#f97316", borderColor: "rgba(249,115,22,0.35)" }}>
                ± Adjust balance
              </button>
              {card.recipientEmail && (
                <button onClick={onResend} disabled={actionPending} style={{ ...btnBase, color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)" }}>
                  ✉ Resend email
                </button>
              )}
              <button onClick={onToggleActive} disabled={actionPending} style={{ ...btnBase, color: card.isActive ? "#fb7185" : "#4ade80", borderColor: card.isActive ? "rgba(251,113,133,0.3)" : "rgba(74,222,128,0.3)" }}>
                {card.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>

        </div>
      </td>
    </tr>
  );
}

// ─── Main page ───────────────────────────────────────────────

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyCreate);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "used" | "deactivated">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustCard, setAdjustCard] = useState<GiftCard | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function fetchCards() {
    setLoading(true);
    api.get<{ data: { cards: GiftCard[] } }>("/api/v1/admin/gift-cards")
      .then((r) => setCards(r.data.cards))
      .catch((e: Error) => setGlobalError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCards(); }, []);

  function setField(field: keyof CreateForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setCreateError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/api/v1/admin/gift-cards", {
        amount: parseInt(form.amount, 10) || 0,
        recipientEmail: form.recipientEmail.trim() || undefined,
        recipientName: form.recipientName.trim() || undefined,
        message: form.message.trim() || undefined,
        expiresAt: form.expiresAt || undefined
      });
      setForm(emptyCreate);
      setShowCreate(false);
      fetchCards();
    } catch (e: unknown) {
      setCreateError((e as { message?: string })?.message ?? "Failed to create gift card");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(card: GiftCard) {
    setPendingId(card.id);
    try {
      await api.patch(`/api/v1/admin/gift-cards/${card.id}`, { isActive: !card.isActive });
      fetchCards();
    } catch (e: unknown) {
      setGlobalError((e as { message?: string })?.message ?? "Failed to update");
    } finally {
      setPendingId(null);
    }
  }

  async function updateExpiry(card: GiftCard, dateStr: string) {
    setPendingId(card.id);
    try {
      await api.patch(`/api/v1/admin/gift-cards/${card.id}`, { expiresAt: dateStr || "" });
      fetchCards();
    } finally {
      setPendingId(null);
    }
  }

  async function resendEmail(card: GiftCard) {
    setPendingId(card.id);
    setGlobalMsg(null);
    setGlobalError(null);
    try {
      await api.post(`/api/v1/admin/gift-cards/${card.id}/resend-email`, {});
      setGlobalMsg(`Delivery email resent to ${card.recipientEmail}`);
    } catch (e: unknown) {
      setGlobalError((e as { message?: string })?.message ?? "Failed to resend email");
    } finally {
      setPendingId(null);
    }
  }

  const searchLower = search.toLowerCase();
  const filteredCards = cards.filter((c) => {
    if (searchLower) {
      const codeMatch = c.code.toLowerCase().includes(searchLower.replace(/-/g, ""));
      const emailMatch = c.recipientEmail?.toLowerCase().includes(searchLower) ?? false;
      if (!codeMatch && !emailMatch) return false;
    }
    if (filter === "active") return c.isActive && c.balance > 0 && (!c.expiresAt || new Date(c.expiresAt) > new Date());
    if (filter === "used") return c.balance === 0;
    if (filter === "deactivated") return !c.isActive;
    return true;
  });

  const totalIssued = cards.reduce((sum, c) => sum + c.initialAmount, 0);
  const totalRedeemed = cards.reduce((sum, c) => sum + (c.initialAmount - c.balance), 0);
  const outstanding = totalIssued - totalRedeemed;
  const activeCount = cards.filter((c) => c.isActive && c.balance > 0 && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length;

  const inputStyle = {
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
    background: "rgba(255,255,255,0.05)", color: "#f6f1ea", padding: "0.65rem 0.75rem",
    font: "inherit", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const
  };

  const labelStyle = {
    display: "block", fontSize: "0.72rem", fontWeight: 600 as const,
    color: "rgba(246,241,234,0.5)", textTransform: "uppercase" as const,
    letterSpacing: "0.06em", marginBottom: "0.3rem"
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Gift Cards</h1>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            onClick={() => exportCsv(filteredCards)}
            disabled={filteredCards.length === 0}
            style={{ padding: "0.55rem 1rem", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(246,241,234,0.7)", cursor: "pointer", fontSize: "0.83rem", fontWeight: 600 }}
          >
            ↓ Export CSV
          </button>
          <button
            onClick={() => setShowCreate((v) => !v)}
            style={{ padding: "0.6rem 1.25rem", borderRadius: 8, background: "#f97316", color: "#0a0a0f", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}
          >
            {showCreate ? "Cancel" : "+ Issue gift card"}
          </button>
        </div>
      </div>

      {/* Feedback banners */}
      {globalError && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.3)", borderRadius: 8, color: "#fb7185", fontSize: "0.875rem", display: "flex", justifyContent: "space-between" }}>
          {globalError}
          <button onClick={() => setGlobalError(null)} style={{ background: "none", border: "none", color: "#fb7185", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>×</button>
        </div>
      )}
      {globalMsg && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 8, color: "#4ade80", fontSize: "0.875rem", display: "flex", justifyContent: "space-between" }}>
          {globalMsg}
          <button onClick={() => setGlobalMsg(null)} style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* KPI tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Issued", value: formatCurrency(totalIssued) },
          { label: "Total Redeemed", value: formatCurrency(totalRedeemed) },
          { label: "Outstanding", value: formatCurrency(outstanding) },
          { label: "Active Cards", value: String(activeCount) }
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1rem" }}>
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.72rem", color: "rgba(246,241,234,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>Issue Gift Card</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Amount (₹) *</label>
              <input style={{ ...inputStyle, width: "100%" }} type="number" min={100} max={50000} value={form.amount} onChange={(e) => setField("amount", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Expires at <span style={{ textTransform: "none", fontWeight: 400 }}>(default 2yr)</span></label>
              <input style={{ ...inputStyle, width: "100%" }} type="date" value={form.expiresAt} onChange={(e) => setField("expiresAt", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Recipient email</label>
              <input style={{ ...inputStyle, width: "100%" }} type="email" value={form.recipientEmail} onChange={(e) => setField("recipientEmail", e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Recipient name</label>
              <input style={{ ...inputStyle, width: "100%" }} type="text" value={form.recipientName} onChange={(e) => setField("recipientName", e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Message</label>
            <input style={{ ...inputStyle, width: "100%" }} type="text" value={form.message} onChange={(e) => setField("message", e.target.value)} placeholder="Optional personal message" maxLength={300} />
          </div>
          {createError && <p style={{ margin: 0, color: "#fb7185", fontSize: "0.82rem" }}>{createError}</p>}
          <button type="submit" disabled={creating} style={{ padding: "0.65rem 1.5rem", borderRadius: 8, background: "#f97316", color: "#0a0a0f", border: "none", fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", fontSize: "0.88rem", justifySelf: "start" }}>
            {creating ? "Creating…" : "Issue card"}
          </button>
        </form>
      )}

      {/* Search + filters row */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or recipient email…"
          style={{ ...inputStyle, flex: "1 1 220px", minWidth: 200 }}
        />
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["all", "active", "used", "deactivated"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.4rem 0.85rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600,
                background: filter === f ? "rgba(249,115,22,0.15)" : "transparent",
                border: `1px solid ${filter === f ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: filter === f ? "#f97316" : "rgba(246,241,234,0.6)", cursor: "pointer"
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {(search || filter !== "all") && (
          <span style={{ fontSize: "0.8rem", color: "rgba(246,241,234,0.4)" }}>
            {filteredCards.length} of {cards.length}
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "rgba(246,241,234,0.5)", padding: "2rem 0" }}>Loading…</div>
      ) : filteredCards.length === 0 ? (
        <div style={{ color: "rgba(246,241,234,0.5)", padding: "2rem 0", textAlign: "center" }}>No gift cards found.</div>
      ) : (
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", textAlign: "left" }}>
                {["", "Code", "Amount", "Balance", "Recipient", "Status", "Expires", "Created"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "rgba(246,241,234,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => {
                const st = statusLabel(card);
                const isExpanded = expandedId === card.id;
                const isPending = pendingId === card.id;
                return (
                  <Fragment key={card.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : card.id)}
                      style={{ borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer", background: isExpanded ? "rgba(249,115,22,0.04)" : "transparent" }}
                    >
                      <td style={{ padding: "0.75rem 0.5rem 0.75rem 1rem", color: "rgba(246,241,234,0.4)", fontSize: "0.7rem" }}>
                        {isExpanded ? "▾" : "▸"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.82rem" }}>{formatCode(card.code)}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>{formatCurrency(card.initialAmount)}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ color: card.balance > 0 ? "#4ade80" : "rgba(246,241,234,0.35)", fontWeight: 600 }}>{formatCurrency(card.balance)}</span>
                        {card.balance < card.initialAmount && card.balance > 0 && (
                          <span style={{ marginLeft: "0.4rem", fontSize: "0.72rem", color: "rgba(246,241,234,0.35)" }}>
                            ({Math.round((1 - card.balance / card.initialAmount) * 100)}% used)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "rgba(246,241,234,0.7)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {card.recipientEmail ?? <span style={{ color: "rgba(246,241,234,0.3)" }}>—</span>}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: st.color, padding: "2px 8px", borderRadius: 99, background: `${st.color}18`, border: `1px solid ${st.color}44` }}>{st.label}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "rgba(246,241,234,0.5)", fontSize: "0.8rem" }}>
                        {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "rgba(246,241,234,0.4)", fontSize: "0.78rem" }}>
                        {new Date(card.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                    {isExpanded && (
                      <DetailRow
                        key={`${card.id}-detail`}
                        card={card}
                        actionPending={isPending}
                        onAdjust={() => setAdjustCard(card)}
                        onResend={() => resendEmail(card)}
                        onToggleActive={() => toggleActive(card)}
                        onExpiryChange={(dateStr) => updateExpiry(card, dateStr)}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Balance adjustment modal */}
      {adjustCard && (
        <AdjustBalanceModal
          card={adjustCard}
          onClose={() => setAdjustCard(null)}
          onDone={() => { setAdjustCard(null); fetchCards(); }}
        />
      )}
    </div>
  );
}
