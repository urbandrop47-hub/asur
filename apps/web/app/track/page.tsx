"use client";

import { useState } from "react";
import Link from "next/link";
import { getCourierTrackingUrl } from "@asur/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending payment",
  paid: "Payment confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#f97316",
  paid: "#3b82f6",
  processing: "#8b5cf6",
  packed: "#8b5cf6",
  shipped: "#22c55e",
  delivered: "#22c55e",
  cancelled: "#ef4444"
};

type TrackResult = {
  orderNumber: string;
  status: string;
  trackingNumber: string | null;
  courierName: string | null;
  createdAt: string;
  shippingAddress: { fullName: string; city: string; state: string; postalCode: string };
  items: { title: string; quantity: number; variantSku: string }[];
};

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        orderNumber: orderNumber.trim().toUpperCase(),
        email: email.trim().toLowerCase()
      });
      const res = await fetch(`${API_URL}/api/v1/track?${params}`);
      const json = await res.json() as { success: boolean; data?: TrackResult; message?: string };
      if (!res.ok || !json.success) {
        setError(json.message ?? "Order not found. Please check your order number and email.");
        return;
      }
      setResult(json.data!);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setOrderNumber("");
    setEmail("");
  }

  const trackUrl = result?.courierName && result?.trackingNumber
    ? getCourierTrackingUrl(result.courierName, result.trackingNumber)
    : null;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "3rem 1rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
          Order tracking
        </p>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Where&apos;s my order?
        </h1>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Enter your order number and email to see live tracking. No login required.
        </p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
              Order number
            </label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ASUR-XXXXXXXX"
              autoCapitalize="characters"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "0.75rem 1rem", borderRadius: 12,
                border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)",
                color: "var(--text)", fontSize: "0.95rem", fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.05em", outline: "none"
              }}
            />
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Found in your confirmation email or <Link href="/orders" style={{ color: "var(--accent)" }}>order history</Link>.
            </p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "0.75rem 1rem", borderRadius: 12,
                border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)",
                color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit",
                outline: "none"
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: 10,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444", fontSize: "0.85rem"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !orderNumber.trim() || !email.trim()}
            style={{
              padding: "0.9rem", borderRadius: 999, fontWeight: 800, fontSize: "0.95rem",
              background: loading || !orderNumber.trim() || !email.trim()
                ? "rgba(255,255,255,0.08)"
                : "linear-gradient(135deg, #f97316, #fb7185)",
              color: loading || !orderNumber.trim() || !email.trim() ? "var(--text-muted)" : "#130f0b",
              border: "none", cursor: loading || !orderNumber.trim() || !email.trim() ? "not-allowed" : "pointer",
              minHeight: 52
            }}
          >
            {loading ? "Looking up…" : "Track order"}
          </button>
        </form>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {/* Status header */}
          <div style={{
            border: `1px solid ${STATUS_COLOR[result.status] ?? "var(--border)"}40`,
            borderRadius: 16, padding: "1.25rem",
            background: `${STATUS_COLOR[result.status] ?? "#6b7280"}08`
          }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
              {result.orderNumber}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLOR[result.status] ?? "#6b7280", flexShrink: 0 }} />
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: STATUS_COLOR[result.status] ?? "var(--text)" }}>
                {STATUS_LABEL[result.status] ?? result.status}
              </span>
            </div>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Ordered {new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Tracking info */}
          {result.trackingNumber && (
            <div style={{
              border: "1px solid rgba(34,197,94,0.25)", borderRadius: 16, padding: "1rem",
              background: "rgba(34,197,94,0.04)", display: "grid", gap: "0.6rem"
            }}>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--success)" }}>
                Shipment details
              </p>
              {result.courierName && (
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{result.courierName}</p>
              )}
              <p style={{ margin: 0, fontSize: "0.85rem", fontFamily: "var(--font-mono, monospace)", color: "var(--text-muted)" }}>
                {result.trackingNumber}
              </p>
              {trackUrl && (
                <a
                  href={trackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.6rem 1.1rem", borderRadius: 999, fontSize: "0.85rem", fontWeight: 700,
                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                    color: "var(--success)", textDecoration: "none", alignSelf: "flex-start"
                  }}
                >
                  Track on {result.courierName}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Items */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <p style={{ margin: 0, padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              Items
            </p>
            {result.items.map((item) => (
              <div key={item.variantSku} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>{item.title}</p>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.variantSku}</p>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>×{item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Shipping address */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.9rem 1rem" }}>
            <p style={{ margin: "0 0 0.3rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              Delivering to
            </p>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6 }}>
              {result.shippingAddress.fullName}<br />
              {result.shippingAddress.city}, {result.shippingAddress.state} {result.shippingAddress.postalCode}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem", borderRadius: 999, fontWeight: 600, fontSize: "0.88rem",
                border: "1px solid var(--border)", background: "transparent", color: "var(--text)",
                cursor: "pointer"
              }}
            >
              Track another order
            </button>
            <Link
              href="/orders"
              style={{
                display: "block", textAlign: "center",
                padding: "0.75rem", borderRadius: 999, fontWeight: 600, fontSize: "0.88rem",
                border: "1px solid rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.06)",
                color: "var(--accent)", textDecoration: "none"
              }}
            >
              Sign in to see all orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
