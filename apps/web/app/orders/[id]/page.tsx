"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Order } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { useAuthStore } from "../../../store/auth-store";
import { api } from "../../../lib/api";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_payment: "Pending payment",
  paid: "Paid",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "var(--warning)",
  paid: "#3b82f6",
  processing: "var(--accent-3)",
  packed: "var(--accent-3)",
  shipped: "var(--success)",
  delivered: "var(--success)",
  cancelled: "var(--danger)"
};

const TIMELINE_STEPS: { key: Order["status"]; label: string }[] = [
  { key: "pending_payment", label: "Order placed" },
  { key: "paid", label: "Payment confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" }
];

const STEP_ORDER = TIMELINE_STEPS.map((s) => s.key);

function OrderTimeline({ status }: { status: Order["status"] }) {
  const currentIdx = STEP_ORDER.indexOf(status);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1rem" }}>
      <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Order status
      </p>
      <div style={{ display: "grid", gap: "0" }}>
        {TIMELINE_STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          const dotColor = isDone || isActive ? "var(--success)" : "var(--border)";
          const lineColor = isDone ? "var(--success)" : "var(--border)";

          return (
            <div key={step.key} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: dotColor,
                  border: isActive ? "2px solid var(--success)" : "2px solid transparent",
                  boxShadow: isActive ? "0 0 0 3px rgba(34,197,94,0.2)" : "none",
                  marginTop: 2,
                  flexShrink: 0
                }} />
                {i < TIMELINE_STEPS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: lineColor, margin: "2px 0" }} />
                )}
              </div>
              <p style={{
                margin: "0 0 1rem",
                fontSize: "0.875rem",
                fontWeight: isActive ? 700 : 400,
                color: isDone || isActive ? "var(--text)" : "var(--text-muted)"
              }}>
                {step.label}
                {isActive && (
                  <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)", marginTop: 2 }}>
                    Current status
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, hydrated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace(`/auth?next=/orders/${id}`);
      return;
    }
    if (!id) return;
    api
      .get<{ data: Order }>(`/api/v1/orders/${id}`)
      .then((r) => {
        if (r.data) setOrder(r.data);
        else setNotFound(true);
      })
      .catch((e) => {
        if (e?.status === 404) setNotFound(true);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [session, hydrated, id, router]);

  if (!hydrated || !session) return null;

  if (loading) {
    return (
      <div style={{ maxWidth: 560, margin: "3rem auto", display: "grid", gap: "1rem", padding: "0 1rem" }}>
        <div className="skeleton" style={{ height: 80, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <h2>Order not found</h2>
        <p>This order doesn&apos;t exist or doesn&apos;t belong to your account.</p>
        <Link href="/orders" className="badge">Back to orders</Link>
      </div>
    );
  }

  const statusColor = STATUS_COLOR[order.status] ?? "var(--text-muted)";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem 4rem", display: "grid", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/orders" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none" }}>
          ← Orders
        </Link>
      </div>

      <div>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.3rem", fontWeight: 800 }}>{order.orderNumber}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: statusColor }}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Timeline */}
      {order.status !== "cancelled" && <OrderTimeline status={order.status} />}

      {/* Items */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <p style={{ margin: 0, padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Items
        </p>
        {order.items.map((item) => (
          <div key={item.variantSku} style={{ display: "flex", gap: "1rem", padding: "0.9rem 1rem", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>{item.title}</p>
              <p style={{ margin: "0.1rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {item.variantSku} · ×{item.quantity}
              </p>
            </div>
            <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</span>
          </div>
        ))}
        <div style={{ padding: "0.9rem 1rem", display: "grid", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>Shipping</span>
            <span style={{ color: order.shipping === 0 ? "var(--success)" : "inherit" }}>
              {order.shipping === 0 ? "Free" : formatCurrency(order.shipping)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>GST</span><span>{formatCurrency(order.tax)}</span>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.3rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem" }}>
            <span>Total</span><span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment & Fulfillment status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.85rem" }}>
          <p style={{ margin: "0 0 0.3rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Payment</p>
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, textTransform: "capitalize" }}>
            {order.paymentStatus.replace("_", " ")}
          </p>
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.85rem" }}>
          <p style={{ margin: "0 0 0.3rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fulfillment</p>
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, textTransform: "capitalize" }}>
            {order.fulfillmentStatus.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Shipping address */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Shipping to
        </p>
        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.7 }}>
          <strong>{order.shippingAddress.fullName}</strong> · {order.shippingAddress.phone}<br />
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
        </p>
      </div>

      {/* Post-delivery review prompt */}
      {(order.status === "delivered" || order.status === "shipped") && (
        <div style={{
          border: "1px solid rgba(249,115,22,0.25)", borderRadius: 16, padding: "1.1rem 1.25rem",
          background: "rgba(249,115,22,0.06)",
          animation: "fadeInUp 0.35s ease both",
        }}>
          <p style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.92rem" }}>
            {order.status === "delivered" ? "How was your order?" : "Almost there — share your thoughts?"}
          </p>
          <p style={{ margin: "0 0 0.85rem", fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            {order.status === "delivered"
              ? "Your ASUR drop has arrived. Leave a review to help other customers."
              : "Your order is on its way. You can review once it arrives."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {order.items.map((item) => (
              <Link
                key={item.variantSku}
                href={`/products/${item.variantSku.split("-").slice(0, -2).join("-") || "?"}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.45rem 0.9rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600,
                  border: "1px solid rgba(249,115,22,0.35)", color: "var(--accent)",
                  background: "rgba(249,115,22,0.08)", textDecoration: "none",
                }}
              >
                Review {item.title}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <Link
        href="/products"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 999, padding: "0.9rem", fontSize: "0.92rem", fontWeight: 600,
          border: "1px solid rgba(255,255,255,0.14)", color: "var(--text)",
          textDecoration: "none", minHeight: 48
        }}
      >
        Continue shopping
      </Link>
    </div>
  );
}
