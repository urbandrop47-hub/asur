"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";

type SiteConfig = {
  announcementBar: { text: string; link?: string; bgColor: string; isActive: boolean };
  freeShippingThreshold: number;
  shippingFee: number;
  gstRate: number;
  gstin?: string;
  businessName?: string;
  businessAddress?: string;
  updatedAt?: string;
};

const DEFAULT: SiteConfig = {
  announcementBar: { text: "", link: "", bgColor: "rgba(249,115,22,0.9)", isActive: true },
  freeShippingThreshold: 1500,
  shippingFee: 250,
  gstRate: 0.18,
  gstin: "",
  businessName: "",
  businessAddress: ""
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10, background: "rgba(255,255,255,0.05)",
  color: "var(--text)", padding: "0.7rem 0.9rem",
  font: "inherit", fontSize: "0.9rem", outline: "none", minHeight: 42
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.72rem", fontWeight: 600,
  color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.07em", marginBottom: "0.35rem"
};

const card: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 16,
  padding: "1.5rem", marginBottom: "1.25rem",
  background: "rgba(255,255,255,0.02)"
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 26, borderRadius: 999, border: "none",
        background: checked ? "#f97316" : "rgba(255,255,255,0.12)",
        cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0
      }}
    >
      <span style={{ position: "absolute", top: 3, left: checked ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: SiteConfig }>("/api/v1/admin/config")
      .then((r) => setConfig({ ...DEFAULT, ...r.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.patch("/api/v1/admin/config", {
        announcementBar: {
          text: config.announcementBar.text,
          link: config.announcementBar.link || undefined,
          bgColor: config.announcementBar.bgColor,
          isActive: config.announcementBar.isActive
        },
        freeShippingThreshold: config.freeShippingThreshold,
        shippingFee: config.shippingFee,
        gstRate: config.gstRate,
        gstin: config.gstin || undefined,
        businessName: config.businessName || undefined,
        businessAddress: config.businessAddress || undefined
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function setBar(k: keyof typeof config.announcementBar, v: unknown) {
    setConfig((c) => ({ ...c, announcementBar: { ...c.announcementBar, [k]: v } }));
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640 }}>
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.4rem", fontWeight: 800 }}>Settings</h1>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Store Settings</h1>
        {config.updatedAt && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Last saved {new Date(config.updatedAt).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      {/* Announcement bar */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.2rem", fontSize: "0.95rem", fontWeight: 700 }}>Announcement bar</h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Shown above the header on all pages. Dismissible by customers.</p>
          </div>
          <Toggle checked={config.announcementBar.isActive} onChange={(v) => setBar("isActive", v)} />
        </div>

        <div style={{ display: "grid", gap: "0.85rem", opacity: config.announcementBar.isActive ? 1 : 0.5 }}>
          <div>
            <label style={labelStyle}>Message text</label>
            <input
              style={inputStyle}
              value={config.announcementBar.text}
              onChange={(e) => setBar("text", e.target.value)}
              placeholder="FREE SHIPPING on orders above ₹1,500"
              maxLength={200}
            />
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>{config.announcementBar.text.length}/200</p>
          </div>
          <div>
            <label style={labelStyle}>Link URL (optional)</label>
            <input
              style={inputStyle}
              value={config.announcementBar.link ?? ""}
              onChange={(e) => setBar("link", e.target.value)}
              placeholder="/products or https://..."
            />
          </div>
          <div>
            <label style={labelStyle}>Background colour</label>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={config.announcementBar.bgColor}
                onChange={(e) => setBar("bgColor", e.target.value)}
                placeholder="rgba(249,115,22,0.9) or #f97316"
              />
              <div style={{ width: 36, height: 36, borderRadius: 8, background: config.announcementBar.bgColor, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
            </div>
          </div>

          {/* Preview */}
          {config.announcementBar.isActive && config.announcementBar.text && (
            <div style={{ borderRadius: 8, overflow: "hidden" }}>
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Preview</p>
              <div style={{ background: config.announcementBar.bgColor, padding: "0.55rem 1rem", borderRadius: 8, textAlign: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#130f0b" }}>
                  {config.announcementBar.text}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shipping & Tax */}
      <div style={card}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700 }}>Shipping & Tax</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
          <div>
            <label style={labelStyle}>Free shipping threshold (₹)</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={100000}
              value={config.freeShippingThreshold}
              onChange={(e) => setConfig((c) => ({ ...c, freeShippingThreshold: Number(e.target.value) }))}
            />
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>Orders above this get free shipping</p>
          </div>
          <div>
            <label style={labelStyle}>Shipping fee (₹)</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={10000}
              value={config.shippingFee}
              onChange={(e) => setConfig((c) => ({ ...c, shippingFee: Number(e.target.value) }))}
            />
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>Charged on orders below threshold</p>
          </div>
          <div>
            <label style={labelStyle}>GST rate</label>
            <select
              style={{ ...inputStyle, appearance: "none" as const }}
              value={config.gstRate}
              onChange={(e) => setConfig((c) => ({ ...c, gstRate: Number(e.target.value) }))}
            >
              <option value={0.05}>5% GST</option>
              <option value={0.12}>12% GST</option>
              <option value={0.18}>18% GST</option>
              <option value={0.28}>28% GST</option>
            </select>
          </div>
        </div>

        {/* Calculated summary */}
        <div style={{ marginTop: "1rem", padding: "0.85rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--text)" }}>Summary:</strong>{" "}
          Orders above ₹{config.freeShippingThreshold.toLocaleString("en-IN")} get free shipping. Orders below pay ₹{config.shippingFee}. GST at {(config.gstRate * 100).toFixed(0)}% applied on order subtotal after discounts.
        </div>
      </div>

      {/* GST Invoice Settings */}
      <div style={card}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700 }}>GST Invoice</h2>
        <div style={{ display: "grid", gap: "0.85rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            <div>
              <label style={labelStyle}>GSTIN</label>
              <input
                style={inputStyle}
                value={config.gstin ?? ""}
                onChange={(e) => setConfig((c) => ({ ...c, gstin: e.target.value }))}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
            <div>
              <label style={labelStyle}>Business Name</label>
              <input
                style={inputStyle}
                value={config.businessName ?? ""}
                onChange={(e) => setConfig((c) => ({ ...c, businessName: e.target.value }))}
                placeholder="ASUR Apparel Pvt Ltd"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Business Address</label>
            <input
              style={inputStyle}
              value={config.businessAddress ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, businessAddress: e.target.value }))}
              placeholder="123 Fashion Street, Mumbai, Maharashtra 400001"
            />
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>Printed on tax invoices for delivered orders</p>
          </div>
        </div>
      </div>

      {/* Admin tools */}
      <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: "0 0 0.2rem", fontSize: "0.95rem", fontWeight: 700 }}>Audit Log</h2>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>View all admin mutations — product changes, bulk ops, config updates.</p>
        </div>
        <Link href="/settings/audit-log" style={{ padding: "0.45rem 1rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>
          View logs
        </Link>
      </div>

      {/* Save */}
      {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>}
      {saved && <p style={{ color: "var(--success, #22c55e)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem" }}>✓ Settings saved</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: "0.85rem 2rem", borderRadius: 999, fontWeight: 700, fontSize: "0.95rem", border: "none",
          background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b",
          cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1, minHeight: 48
        }}
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
