"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Order } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { api } from "../../../../lib/api";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const STATUS_COLORS: Record<string, string> = {
  paid: "var(--success)",
  processing: "var(--accent-3)",
  shipped: "var(--accent-3)",
  delivered: "var(--success)",
  cancelled: "var(--danger)",
  pending_payment: "var(--warning)"
};

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<{ data: Order }>(`/api/v1/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 560, margin: "3rem auto", display: "grid", gap: "1rem" }}>
        <div className="skeleton skeleton-line" style={{ height: 120, borderRadius: 20 }} />
        <div className="skeleton skeleton-line" style={{ height: 200, borderRadius: 20 }} />
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

  const statusColor = STATUS_COLORS[order.status] ?? "var(--text-muted)";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: "2rem", display: "grid", gap: "1.5rem" }}>
      {/* Success header */}
      <div
        style={{
          textAlign: "center",
          padding: "2rem 1.5rem",
          border: "1px solid rgba(34, 197, 94, 0.25)",
          borderRadius: 20,
          background: "rgba(34, 197, 94, 0.06)",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✓</div>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800, color: "var(--success)" }}>
          Order confirmed!
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Your order <strong style={{ color: "var(--text)" }}>{order.orderNumber}</strong> has been placed successfully.
        </p>
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", justifyContent: "center" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
        <span style={{ color: statusColor, fontWeight: 600, fontSize: "0.9rem" }}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Items */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <p style={{ margin: 0, padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Items ordered
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
            <span>Total paid</span><span>{formatCurrency(order.total)}</span>
          </div>
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

      {/* Actions */}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <Link
          href={`/orders/${order.id}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            borderRadius: 999, padding: "0.9rem", fontSize: "0.95rem", fontWeight: 700,
            background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b",
            textDecoration: "none", minHeight: 48,
          }}
        >
          Track order
        </Link>
        <Link
          href="/products"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 999, padding: "0.9rem", fontSize: "0.92rem", fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.14)", color: "var(--text)",
            textDecoration: "none", minHeight: 48,
          }}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
