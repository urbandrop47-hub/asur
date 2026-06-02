"use client";

import { useEffect, useState } from "react";
import type { Coupon } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { api } from "../../lib/api";

const TYPE_LABELS: Record<Coupon["type"], string> = {
  percent: "% off",
  fixed: "₹ off",
  free_shipping: "Free shipping"
};

function valueLabel(c: Coupon) {
  if (c.type === "percent") return `${c.value}% off`;
  if (c.type === "fixed") return `₹${c.value} off`;
  return "Free shipping";
}

type CreateForm = {
  code: string;
  type: Coupon["type"];
  value: string;
  minOrderValue: string;
  usageLimit: string;
  perCustomerLimit: string;
  expiresAt: string;
  description: string;
};

const emptyForm: CreateForm = {
  code: "", type: "percent", value: "10", minOrderValue: "0",
  usageLimit: "0", perCustomerLimit: "0", expiresAt: "", description: ""
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  function fetchCoupons() {
    setLoading(true);
    api.get<{ data: { coupons: Coupon[] } }>("/api/v1/admin/coupons")
      .then((r) => setCoupons(r.data.coupons))
      .catch((e: Error) => setGlobalError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCoupons(); }, []);

  function setField(field: keyof CreateForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setCreateError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/api/v1/admin/coupons", {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        minOrderValue: parseFloat(form.minOrderValue) || 0,
        usageLimit: parseInt(form.usageLimit, 10) || 0,
        perCustomerLimit: parseInt(form.perCustomerLimit, 10) || 0,
        expiresAt: form.expiresAt || "",
        description: form.description.trim() || undefined,
        isActive: true
      });
      setForm(emptyForm);
      setShowCreate(false);
      fetchCoupons();
    } catch (e: unknown) {
      setCreateError((e as { message?: string })?.message ?? "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    try {
      await api.patch(`/api/v1/admin/coupons/${coupon.code}`, { isActive: !coupon.isActive });
      setCoupons((prev) => prev.map((c) => c.code === coupon.code ? { ...c, isActive: !c.isActive } : c));
    } catch (e: unknown) {
      setGlobalError((e as { message?: string })?.message ?? "Failed to update coupon");
    }
  }

  async function deleteCoupon(code: string) {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    try {
      await api.del(`/api/v1/admin/coupons/${code}`);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
    } catch (e: unknown) {
      setGlobalError((e as { message?: string })?.message ?? "Failed to delete coupon");
    }
  }

  const inputStyle = {
    width: "100%", padding: "0.6rem 0.85rem", borderRadius: 10, border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.88rem",
    fontFamily: "inherit" as const
  };

  return (
    <div>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1>Discount Codes</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {coupons.length} code{coupons.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setShowCreate((v) => !v); setCreateError(null); }}
        >
          {showCreate ? "Cancel" : "+ New code"}
        </button>
      </div>

      {globalError && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{globalError}</div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ padding: "1.25rem", border: "1px solid var(--border)", borderRadius: 16, marginBottom: "1.75rem", background: "rgba(255,255,255,0.02)", animation: "fadeInUp 0.2s ease both" }}>
          <h2 style={{ margin: "0 0 1.1rem", fontSize: "0.95rem", fontWeight: 700 }}>Create coupon</h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Code *</label>
                <input style={inputStyle} type="text" placeholder="LAUNCH20" value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} required pattern="[A-Z0-9_\-]+" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Type *</label>
                <select style={{ ...inputStyle, appearance: "none" as const }} value={form.type} onChange={(e) => setField("type", e.target.value)}>
                  <option value="percent">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </div>
            </div>

            {form.type !== "free_shipping" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {form.type === "percent" ? "Discount %" : "Discount ₹"} *
                  </label>
                  <input style={inputStyle} type="number" min={0} max={form.type === "percent" ? 100 : undefined} value={form.value} onChange={(e) => setField("value", e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Min order ₹</label>
                  <input style={inputStyle} type="number" min={0} value={form.minOrderValue} onChange={(e) => setField("minOrderValue", e.target.value)} />
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Total usage limit <span style={{ fontWeight: 400 }}>(0=∞)</span></label>
                <input style={inputStyle} type="number" min={0} value={form.usageLimit} onChange={(e) => setField("usageLimit", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Per customer <span style={{ fontWeight: 400 }}>(0=∞)</span></label>
                <input style={inputStyle} type="number" min={0} value={form.perCustomerLimit} onChange={(e) => setField("perCustomerLimit", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Expires at</label>
                <input style={inputStyle} type="date" value={form.expiresAt} onChange={(e) => setField("expiresAt", e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Description (internal)</label>
              <input style={inputStyle} type="text" placeholder="Launch campaign — influencer discount" value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>

            {createError && <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--danger)" }}>{createError}</p>}

            <button
              type="submit"
              disabled={creating}
              style={{
                padding: "0.75rem 1.5rem", borderRadius: 999, fontWeight: 700, fontSize: "0.88rem",
                background: "linear-gradient(135deg, #38bdf8, #8b5cf6)", color: "#0b1020",
                border: "none", cursor: creating ? "wait" : "pointer", opacity: creating ? 0.6 : 1,
                justifySelf: "start"
              }}
            >
              {creating ? "Creating…" : "Create coupon"}
            </button>
          </form>
        </div>
      )}

      {/* Coupon table */}
      {loading ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 16 }}>
          No coupons yet. Create your first discount code above.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Code", "Type", "Discount", "Min order", "Usage", "Expires", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c.code} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.75rem", fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem", color: "var(--accent)" }}>{c.code}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)", fontSize: "0.78rem" }}>{TYPE_LABELS[c.type]}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>{valueLabel(c)}</td>
                    <td style={{ padding: "0.75rem" }}>{c.minOrderValue > 0 ? formatCurrency(c.minOrderValue) : "—"}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ color: c.usageLimit > 0 && c.usedCount >= c.usageLimit ? "var(--danger)" : "var(--text)" }}>
                        {c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ""}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.78rem", color: expired ? "var(--danger)" : "var(--text-muted)" }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                      {expired && " (expired)"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <button
                        onClick={() => toggleActive(c)}
                        style={{
                          padding: "2px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                          background: c.isActive ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)",
                          color: c.isActive ? "#4ade80" : "var(--text-muted)",
                          border: "none", cursor: "pointer"
                        }}
                      >
                        {c.isActive ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <button
                        onClick={() => deleteCoupon(c.code)}
                        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem", padding: "2px 6px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
