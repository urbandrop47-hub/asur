"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Order, OrderItem } from "@asur/types";
import { getCourierTrackingUrl } from "@asur/constants";
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
  // "draft" and any future statuses not in STEP_ORDER default to step 0 (order placed)
  const rawIdx = STEP_ORDER.indexOf(status);
  const currentIdx = rawIdx === -1 ? 0 : rawIdx;

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

// ─── Return request dialog ────────────────────────────────────────────────────

type ReturnItemDraft = { variantSku: string; quantity: number; reason: string };

function ReturnDialog({
  order,
  onClose,
  onSubmitted
}: {
  order: Order;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<ReturnItemDraft[]>(
    order.items.map((i: OrderItem) => ({ variantSku: i.variantSku, quantity: i.quantity, reason: "" }))
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleItem(sku: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  }

  function updateItem(sku: string, field: "quantity" | "reason", val: string | number) {
    setItems((prev) => prev.map((it) => it.variantSku === sku ? { ...it, [field]: val } : it));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) { setError("Please describe the reason for your return."); return; }
    const returnItems = items.filter((it) => selected.has(it.variantSku));
    if (returnItems.length === 0) { setError("Select at least one item to return."); return; }
    for (const ri of returnItems) {
      if (!ri.reason.trim()) { setError(`Please enter a reason for ${ri.variantSku}.`); return; }
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/v1/orders/${order.id}/return`, { items: returnItems, reason: reason.trim() });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit return request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 0 0",
        animation: "fadeIn 0.15s ease both"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520, maxHeight: "90dvh",
          background: "var(--surface, #161616)", borderRadius: "20px 20px 0 0",
          border: "1px solid var(--border)", overflow: "auto",
          animation: "slideUp 0.25s cubic-bezier(0.22,1,0.36,1) both"
        }}
      >
        <div style={{ position: "sticky", top: 0, background: "var(--surface, #161616)", padding: "1.1rem 1.25rem 0.85rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem" }}>Request a return</p>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>Order #{order.orderNumber}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.3rem", lineHeight: 1, padding: "0.25rem" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "grid", gap: "1.25rem" }}>
          {/* Item selection */}
          <div>
            <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Select items to return</p>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {order.items.map((item: OrderItem) => {
                const isSelected = selected.has(item.variantSku);
                const draft = items.find((i) => i.variantSku === item.variantSku)!;
                return (
                  <div key={item.variantSku} style={{ border: `1px solid ${isSelected ? "rgba(249,115,22,0.4)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", transition: "border-color 200ms" }}>
                    <div
                      style={{ display: "flex", gap: "0.75rem", padding: "0.75rem 0.9rem", alignItems: "center", cursor: "pointer" }}
                      onClick={() => toggleItem(item.variantSku)}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        background: isSelected ? "rgba(249,115,22,0.2)" : "transparent", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "var(--accent)"
                      }}>
                        {isSelected ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                        <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.variantSku} · ×{item.quantity}</p>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, flexShrink: 0 }}>{formatCurrency(item.totalPrice)}</span>
                    </div>

                    {isSelected && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 0.9rem", display: "grid", gap: "0.6rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Qty:</label>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={draft.quantity}
                            onChange={(e) => updateItem(item.variantSku, "quantity", Math.min(item.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                            style={{ width: 60, padding: "0.35rem 0.5rem", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text)", fontSize: "0.85rem" }}
                          />
                        </div>
                        <input
                          value={draft.reason}
                          onChange={(e) => updateItem(item.variantSku, "reason", e.target.value)}
                          placeholder="Reason for this item..."
                          style={{ padding: "0.5rem 0.75rem", borderRadius: 9, border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text)", fontSize: "0.83rem", width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall reason */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
              Overall return reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(null); }}
              placeholder="Describe why you want to return this order..."
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", padding: "0.7rem 0.9rem", borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text)", fontSize: "0.88rem", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "0.83rem" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "0.95rem", borderRadius: 999, fontWeight: 700, fontSize: "0.95rem",
              background: submitting ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #f97316, #fb7185)",
              color: submitting ? "var(--text-muted)" : "#130f0b",
              border: "none", cursor: submitting ? "not-allowed" : "pointer", minHeight: 52
            }}
          >
            {submitting ? "Submitting…" : "Submit return request"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, hydrated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnSubmitted, setReturnSubmitted] = useState(false);
  const [trackingCopied, setTrackingCopied] = useState(false);

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
  const canRequestReturn = order.status === "delivered" && !returnSubmitted;

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

      {/* Tracking card — shown once order is shipped */}
      {(order.status === "shipped" || order.status === "delivered") && order.trackingNumber && (
        <div style={{
          border: "1px solid rgba(34,197,94,0.25)", borderRadius: 16, padding: "1rem",
          background: "rgba(34,197,94,0.04)"
        }}>
          <p style={{ margin: "0 0 0.6rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Shipment details
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {order.courierName && (
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600 }}>{order.courierName}</p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                {order.trackingNumber}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(order.trackingNumber!);
                  setTrackingCopied(true);
                  setTimeout(() => setTrackingCopied(false), 2000);
                }}
                style={{
                  padding: "2px 8px", borderRadius: 6,
                  border: `1px solid ${trackingCopied ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                  background: trackingCopied ? "rgba(34,197,94,0.08)" : "transparent",
                  color: trackingCopied ? "var(--success)" : "var(--text-muted)", fontSize: "0.72rem",
                  cursor: "pointer", fontFamily: "inherit", transition: "color 150ms, border-color 150ms, background 150ms"
                }}
              >
                {trackingCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            {(() => {
              const trackUrl = order.courierName
                ? getCourierTrackingUrl(order.courierName, order.trackingNumber!)
                : null;
              return trackUrl ? (
                <a
                  href={trackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.5rem 1rem", borderRadius: 999, fontSize: "0.82rem", fontWeight: 700,
                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                    color: "var(--success)", textDecoration: "none", alignSelf: "flex-start"
                  }}
                >
                  Track shipment
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ) : null;
            })()}
          </div>
        </div>
      )}

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
          {(order.discount ?? 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--success)" }}>
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>−{formatCurrency(order.discount ?? 0)}</span>
            </div>
          )}
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
                href={`/products?q=${encodeURIComponent(item.title)}`}
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

      {/* Return request section */}
      {canRequestReturn && (
        <div style={{
          border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "1.1rem 1.25rem",
          background: "rgba(239,68,68,0.04)", animation: "fadeInUp 0.35s ease both",
        }}>
          <p style={{ margin: "0 0 0.3rem", fontWeight: 700, fontSize: "0.92rem" }}>Not satisfied with your order?</p>
          <p style={{ margin: "0 0 0.9rem", fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            You can request a return within 7 days of delivery. Refunds are processed to the original payment method.
          </p>
          <button
            onClick={() => setShowReturnDialog(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.55rem 1.1rem", borderRadius: 999, fontSize: "0.85rem", fontWeight: 700,
              border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444",
              background: "rgba(239,68,68,0.08)", cursor: "pointer"
            }}
          >
            Request return
          </button>
        </div>
      )}

      {returnSubmitted && (
        <div style={{ border: "1px solid rgba(34,197,94,0.25)", borderRadius: 16, padding: "1rem 1.25rem", background: "rgba(34,197,94,0.05)" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "var(--success)" }}>Return request submitted</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.83rem", color: "var(--text-muted)" }}>
            We&apos;ll review your request within 1–2 business days and send a confirmation email.
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "grid", gap: "0.6rem" }}>
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
        {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi ASUR team, I need help with my order #${order.orderNumber}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              borderRadius: 999, padding: "0.9rem", fontSize: "0.92rem", fontWeight: 600,
              border: "1px solid rgba(37,211,102,0.3)", color: "#25d366",
              background: "rgba(37,211,102,0.06)", textDecoration: "none", minHeight: 48
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.123 1.528 5.855L.057 23.2a.5.5 0 0 0 .62.62l5.388-1.466A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 0 1-5.003-1.371l-.36-.213-3.724 1.014 1.02-3.635-.234-.375A9.818 9.818 0 1 1 12 21.818z"/>
            </svg>
            Chat on WhatsApp
          </a>
        )}
      </div>

      {/* Return dialog */}
      {showReturnDialog && order && (
        <ReturnDialog
          order={order}
          onClose={() => setShowReturnDialog(false)}
          onSubmitted={() => {
            setShowReturnDialog(false);
            setReturnSubmitted(true);
          }}
        />
      )}
    </div>
  );
}
