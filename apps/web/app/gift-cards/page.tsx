"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@asur/utils";
import { useAuthStore } from "../../store/auth-store";
import { useCartStore } from "../../store/cart-store";
import { api } from "../../lib/api";

const DENOMINATIONS = [500, 1000, 2000, 5000];

type Form = {
  amount: number | null;
  customAmount: string;
  recipientEmail: string;
  recipientName: string;
  message: string;
};

const emptyForm: Form = {
  amount: null,
  customAmount: "",
  recipientEmail: "",
  recipientName: "",
  message: ""
};

export default function GiftCardsPage() {
  const { session } = useAuthStore();
  const cartItems = useCartStore((s) => s.items);
  const [form, setForm] = useState<Form>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ code: string; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  }

  const finalAmount = form.amount ?? (form.customAmount ? parseInt(form.customAmount, 10) : 0);

  async function handlePurchase() {
    if (!session) {
      window.location.href = "/auth?next=/gift-cards";
      return;
    }

    if (!finalAmount || finalAmount < 100) {
      setError("Minimum gift card amount is ₹100");
      return;
    }
    if (finalAmount > 50000) {
      setError("Maximum gift card amount is ₹50,000");
      return;
    }
    if (!form.recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail)) {
      setError("Enter a valid recipient email");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ data: { card: { code: string; initialAmount: number } } }>("/api/v1/gift-cards/purchase", {
        amount: finalAmount,
        recipientEmail: form.recipientEmail.trim().toLowerCase(),
        recipientName: form.recipientName.trim() || undefined,
        message: form.message.trim() || undefined
      });
      setSuccess({ code: res.data.card.code, amount: res.data.card.initialAmount });
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", color: "var(--text)", padding: "0.85rem 1rem",
    font: "inherit", fontSize: "1rem", outline: "none", minHeight: 48,
    WebkitAppearance: "none" as const
  };

  const labelStyle = {
    display: "block", fontSize: "0.78rem", fontWeight: 600 as const,
    color: "var(--text-muted)", textTransform: "uppercase" as const,
    letterSpacing: "0.06em", marginBottom: "0.4rem"
  };

  if (success) {
    const formatted = success.code.match(/.{1,4}/g)?.join("-") ?? success.code;
    return (
      <div style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎁</div>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.8rem", fontWeight: 900 }}>Gift card sent!</h1>
        <p style={{ margin: "0 0 2rem", color: "var(--text-muted)" }}>
          A {formatCurrency(success.amount)} gift card has been sent to {form.recipientEmail}.
        </p>
        <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 0.4rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Gift card code</p>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, fontFamily: "monospace", letterSpacing: "0.15em", color: "#f97316" }}>{formatted}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => { setSuccess(null); setForm(emptyForm); }}
            style={{ padding: "0.7rem 1.5rem", borderRadius: 999, background: "rgba(255,255,255,0.07)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
          >
            Send another
          </button>
          <Link
            href={session ? "/account/gift-cards" : "/products"}
            style={{ padding: "0.7rem 1.5rem", borderRadius: 999, background: "linear-gradient(135deg,#f97316,#fb7185)", color: "#130f0b", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}
          >
            {session ? "View my gift cards" : "Shop now"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.4rem", fontSize: "clamp(1.4rem,3vw,1.8rem)", fontWeight: 900 }}>Gift Cards</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>Give the gift of fashion — redeemable on anything at ASUR.</p>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Denomination picker */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
          <label style={labelStyle}>Choose amount</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {DENOMINATIONS.map((d) => (
              <button
                key={d}
                onClick={() => set("amount", d === form.amount ? null : d)}
                style={{
                  padding: "0.7rem", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem",
                  background: form.amount === d ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${form.amount === d ? "rgba(249,115,22,0.45)" : "rgba(255,255,255,0.1)"}`,
                  color: form.amount === d ? "var(--accent)" : "var(--text)", cursor: "pointer"
                }}
              >
                ₹{d.toLocaleString()}
              </button>
            ))}
          </div>
          <div>
            <label style={{ ...labelStyle, marginTop: "0.25rem" }}>
              Or enter custom amount (₹100–₹50,000)
            </label>
            <input
              style={inputStyle}
              type="number"
              min={100}
              max={50000}
              inputMode="numeric"
              value={form.customAmount}
              onChange={(e) => { set("customAmount", e.target.value); set("amount", null); }}
              placeholder="e.g. 1500"
            />
          </div>
        </div>

        {/* Recipient details */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Recipient
          </p>
          <div>
            <label style={labelStyle}>Email address *</label>
            <input
              style={inputStyle}
              type="email"
              value={form.recipientEmail}
              onChange={(e) => set("recipientEmail", e.target.value)}
              placeholder="friend@example.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Name <span style={{ color: "rgba(246,241,234,0.4)", fontWeight: 400 }}>(optional)</span></label>
            <input
              style={inputStyle}
              type="text"
              value={form.recipientName}
              onChange={(e) => set("recipientName", e.target.value)}
              placeholder="Priya"
            />
          </div>
          <div>
            <label style={labelStyle}>Personal message <span style={{ color: "rgba(246,241,234,0.4)", fontWeight: 400 }}>(optional)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Happy birthday! Treat yourself to something special ✨"
              maxLength={300}
            />
          </div>
        </div>

        {/* Order summary */}
        {finalAmount >= 100 && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <span>Gift card value</span>
              <strong style={{ color: "var(--text)" }}>{formatCurrency(finalAmount)}</strong>
            </div>
          </div>
        )}

        {error && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--danger)", display: "flex", gap: "0.4rem" }}>
            <span>⚠</span> {error}
          </p>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading || (!form.amount && !form.customAmount)}
          style={{
            width: "100%", borderRadius: 999, padding: "0.95rem", fontSize: "1rem", fontWeight: 700,
            background: "linear-gradient(135deg,#f97316,#fb7185)", color: "#130f0b",
            border: "none", cursor: loading ? "not-allowed" : "pointer", minHeight: 52,
            opacity: loading || (!form.amount && !form.customAmount) ? 0.5 : 1
          }}
        >
          {loading ? "Processing…" : `Send ${finalAmount >= 100 ? formatCurrency(finalAmount) + " " : ""}Gift Card`}
        </button>

        {!session && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
            You&apos;ll need to <Link href="/auth?next=/gift-cards" style={{ color: "var(--accent)" }}>sign in</Link> to complete your purchase.
          </p>
        )}

        {cartItems.length > 0 && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
            Gift cards are purchased separately — they won&apos;t affect your current cart.
          </p>
        )}
      </div>
    </div>
  );
}
