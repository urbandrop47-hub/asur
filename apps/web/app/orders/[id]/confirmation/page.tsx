"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Order } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { useAuthStore } from "../../../../store/auth-store";
import { api } from "../../../../lib/api";

// ─── Animated checkmark ───────────────────────────────────────────────────────

function AnimatedCheck() {
  return (
    <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 1rem" }}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        {/* Pulsing ring */}
        <circle cx="40" cy="40" r="38" stroke="rgba(34,197,94,0.15)" strokeWidth="2"
          style={{ animation: "pulse-ring 2.5s ease-in-out infinite" }} />
        {/* Progress circle */}
        <circle
          cx="40" cy="40" r="34"
          stroke="url(#checkGrad)" strokeWidth="3"
          strokeDasharray="213" strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ animation: "draw-circle 0.7s cubic-bezier(0.22,1,0.36,1) both" }}
        />
        {/* Check mark */}
        <path
          d="M24 40l10 10 22-20"
          stroke="url(#checkGrad2)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: "draw-check 0.4s cubic-bezier(0.22,1,0.36,1) 0.6s both" }}
          strokeDasharray="45"
          strokeDashoffset="45"
        />
        <defs>
          <linearGradient id="checkGrad" x1="6" y1="40" x2="74" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22c55e" />
            <stop offset="1" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="checkGrad2" x1="24" y1="40" x2="56" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22c55e" />
            <stop offset="1" stopColor="#86efac" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Order timeline ───────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { status: ["pending_payment"], label: "Order placed", icon: "◎" },
  { status: ["paid", "processing"], label: "Payment confirmed", icon: "◈" },
  { status: ["packed"], label: "Packed & ready", icon: "◧" },
  { status: ["shipped"], label: "Out for delivery", icon: "◫" },
  { status: ["delivered"], label: "Delivered", icon: "◉" }
];

function getStepIndex(status: string): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.status.includes(status));
  return idx === -1 ? 0 : idx;
}

function OrderTimeline({ status }: { status: string }) {
  const currentIdx = getStepIndex(status);
  if (status === "cancelled") return null;
  return (
    <div style={{ padding: "1.25rem", border: "1px solid var(--border)", borderRadius: 16 }}>
      <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Order progress
      </p>
      <div style={{ position: "relative" }}>
        {/* Connector line */}
        <div style={{
          position: "absolute", left: 11, top: 12, bottom: 12, width: 2,
          background: "rgba(255,255,255,0.06)", borderRadius: 999
        }} />
        {/* Filled portion */}
        <div style={{
          position: "absolute", left: 11, top: 12, width: 2,
          height: `${(currentIdx / (TIMELINE_STEPS.length - 1)) * 100}%`,
          background: "linear-gradient(to bottom, #22c55e, #4ade80)",
          borderRadius: 999, transition: "height 800ms cubic-bezier(0.22,1,0.36,1)"
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {TIMELINE_STEPS.map((step, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? (active ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.1)") : "rgba(255,255,255,0.05)",
                  border: `2px solid ${done ? "#22c55e" : "rgba(255,255,255,0.12)"}`,
                  transition: "all 400ms ease",
                  zIndex: 1,
                  fontSize: "0.6rem",
                  color: done ? "#22c55e" : "rgba(255,255,255,0.3)"
                }}>
                  {done ? "✓" : "·"}
                </div>
                <span style={{
                  fontSize: "0.88rem", fontWeight: active ? 700 : 500,
                  color: done ? (active ? "var(--text)" : "var(--text-muted)") : "rgba(255,255,255,0.3)",
                  transition: "color 300ms ease"
                }}>
                  {step.label}
                  {active && <span style={{ marginLeft: 8, fontSize: "0.7rem", color: "var(--success)", fontWeight: 600 }}>← now</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationPageContent />
    </Suspense>
  );
}

function OrderConfirmationPageContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, hydrated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Guest phone: from URL param (immediate redirect) or sessionStorage (F5 refresh)
  const guestPhoneFromUrl = searchParams.get("guestPhone");
  const guestPhone = guestPhoneFromUrl
    ?? (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(`guest_order_${id}`) : null);
  const isGuest = !session && !!guestPhone;

  useEffect(() => {
    if (!hydrated) return;
    if (!id) return;

    if (session) {
      // Authenticated user
      api.get<{ data: Order }>(`/api/v1/orders/${id}`)
        .then((r) => setOrder(r.data))
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    } else if (guestPhone) {
      // Guest with phone — fetch using guestPhone query param
      api.get<{ data: Order }>(`/api/v1/orders/${id}?guestPhone=${encodeURIComponent(guestPhone)}`)
        .then((r) => setOrder(r.data))
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    } else {
      // No session, no guest phone — redirect to auth
      router.replace(`/auth?next=/orders/${id}/confirmation`);
    }
  }, [id, session, guestPhone, hydrated, router]);

  if (!hydrated) return null;
  if (!session && !guestPhone) return null;

  if (loading) {
    return (
      <div style={{ maxWidth: 520, margin: "3rem auto", display: "grid", gap: "1rem", padding: "0 1rem" }}>
        <div className="skeleton" style={{ height: 180, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <h2>Order not found</h2>
        <p>We couldn&apos;t load this order. Check your orders page.</p>
        <Link href="/orders" className="badge">Go to orders</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2.5rem 1rem 5rem", display: "grid", gap: "1.25rem", animation: "fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
      {/* Animated success header */}
      <div style={{
        textAlign: "center",
        padding: "2.25rem 1.5rem",
        border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: 24,
        background: "linear-gradient(160deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))",
      }}>
        <AnimatedCheck />
        <h1 style={{ margin: "0 0 0.45rem", fontSize: "1.6rem", fontWeight: 800, color: "var(--success)" }}>
          Order confirmed!
        </h1>
        <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Your order <strong style={{ color: "var(--text)", fontFamily: "var(--f-mono)", letterSpacing: "0.04em" }}>{order.orderNumber}</strong> has been placed.
        </p>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {isGuest ? "Save your order number to track it." : "A confirmation email has been sent to you."}
        </p>
      </div>

      {/* Order timeline */}
      <OrderTimeline status={order.status} />

      {/* Items */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <p style={{ margin: 0, padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
        </p>
        {order.items.map((item) => (
          <div key={item.variantSku} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
              <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--f-mono)" }}>
                {item.variantSku} · ×{item.quantity}
              </p>
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}>{formatCurrency(item.totalPrice)}</span>
          </div>
        ))}

        {/* Totals */}
        <div style={{ padding: "0.9rem 1rem", display: "grid", gap: "0.45rem", background: "rgba(255,255,255,0.01)" }}>
          {[
            { label: "Subtotal", value: formatCurrency(order.subtotal) },
            ...(order.discount && order.discount > 0 ? [{ label: `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, value: `−${formatCurrency(order.discount)}`, green: true }] : []),
            { label: "Shipping", value: order.shipping === 0 ? "Free" : formatCurrency(order.shipping), green: order.shipping === 0 },
            { label: "GST (18%)", value: formatCurrency(order.tax) }
          ].map(({ label, value, green }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>{label}</span>
              <span style={{ color: green ? "var(--success)" : "inherit" }}>{value}</span>
            </div>
          ))}
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.35rem 0 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.05rem" }}>
            <span>Total paid</span>
            <span style={{ color: "var(--text)" }}>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1rem 1.1rem" }}>
        <p style={{ margin: "0 0 0.55rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Shipping to
        </p>
        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.75 }}>
          <strong>{order.shippingAddress.fullName}</strong> · {order.shippingAddress.phone}<br />
          {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
        </p>
      </div>

      {/* What happens next */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.1rem 1.25rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          What happens next
        </p>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[
            { step: "1", text: "We'll pack your order within 1–2 business days and send a shipping confirmation." },
            { step: "2", text: "Delivery typically takes 3–7 business days across India." },
            { step: "3", text: "If anything isn't right, you have 7 days from delivery to request a return." },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 800, color: "#f97316" }}>
                {step}
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(246,241,234,0.6)", lineHeight: 1.65 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guest sign-in nudge */}
      {isGuest && (
        <div style={{ border: "1px solid rgba(249,115,22,0.2)", borderRadius: 16, padding: "1.1rem 1.25rem", background: "rgba(249,115,22,0.04)" }}>
          <p style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.92rem" }}>Sign in to track this order</p>
          <p style={{ margin: "0 0 0.85rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Enter your number <strong>{guestPhone}</strong> via Phone OTP and this order will appear in your account automatically.
          </p>
          <Link
            href={`/auth?next=/orders/${order.id}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "0.6rem 1.25rem", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "var(--accent)", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}
          >
            Sign in with phone →
          </Link>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "grid", gap: "0.65rem" }}>
        {!isGuest && (
          <Link
            href={`/orders/${order.id}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              borderRadius: 999, padding: "0.95rem",
              background: "linear-gradient(135deg, #f97316, #fb7185)",
              color: "#130f0b", fontWeight: 700, fontSize: "0.95rem",
              textDecoration: "none", minHeight: 52,
              boxShadow: "0 6px 24px rgba(249,115,22,0.25)",
            }}
          >
            Track order
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
        <Link
          href="/products"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 999, padding: "0.9rem",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--text)", fontWeight: 600, fontSize: "0.9rem",
            textDecoration: "none", minHeight: 50,
          }}
        >
          Continue shopping
        </Link>
      </div>

      {/* Brand moment */}
      <p style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(246,241,234,0.28)", fontFamily: "var(--f-mono)", letterSpacing: "0.06em" }}>
        ASUR · Neither Divine. Nor Damned.
      </p>
    </div>
  );
}
