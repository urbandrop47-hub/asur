"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Order } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { api } from "../../../lib/api";
import { readAdminToken } from "../../../lib/auth-storage";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", pending_payment: "Pending payment", paid: "Paid",
  processing: "Processing", packed: "Packed", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled"
};

const STATUS_CLASS: Record<string, string> = {
  pending_payment: "badge warning", paid: "badge info", processing: "badge info",
  packed: "badge info", shipped: "badge success", delivered: "badge success",
  cancelled: "badge danger", draft: "badge draft"
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ data: Order }>(`/api/v1/admin/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 640, display: "grid", gap: "1rem" }}>
        <div className="skeleton" style={{ height: 40, width: "40%" }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="empty-state">
        <h2>Order not found</h2>
        <Link href="/orders" className="btn-ghost">Back to orders</Link>
      </div>
    );
  }

  const date = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div style={{ maxWidth: 640, display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/orders" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>← Orders</Link>
      </div>

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "1.3rem" }}>{order.orderNumber}</h1>
          <span className={STATUS_CLASS[order.status] ?? "badge"}>{STATUS_LABEL[order.status] ?? order.status}</span>
          {["shipped", "delivered", "processing", "packed"].includes(order.status) && (
            <button
              onClick={async () => {
                const token = readAdminToken();
                const r = await fetch(`${BACKEND}/api/v1/admin/orders/${order.id}/invoice`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (!r.ok) { alert("Could not generate invoice"); return; }
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ASUR-Invoice-${order.orderNumber}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                marginLeft: "auto", padding: "0.35rem 0.85rem", borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit"
              }}
            >
              Download Invoice
            </button>
          )}
        </div>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>{date}</p>
      </div>

      {/* Status chips */}
      <div className="grid-2">
        <div className="card" style={{ padding: "0.9rem" }}>
          <p style={{ margin: "0 0 0.3rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Payment</p>
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, textTransform: "capitalize" }}>{order.paymentStatus.replace(/_/g, " ")}</p>
        </div>
        <div className="card" style={{ padding: "0.9rem" }}>
          <p style={{ margin: "0 0 0.3rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fulfillment</p>
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, textTransform: "capitalize" }}>{order.fulfillmentStatus.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* Items */}
      <div className="table-card">
        <p style={{ margin: 0, padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Items ({order.items.length})
        </p>
        {order.items.map((item) => (
          <div key={item.variantSku} style={{ display: "flex", gap: "1rem", padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>{item.title}</p>
              <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.variantSku} · ×{item.quantity}</p>
            </div>
            <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</span>
          </div>
        ))}
        <div style={{ padding: "0.85rem 1.25rem", display: "grid", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          {(order.discount ?? 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--success)" }}>
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>−{formatCurrency(order.discount ?? 0)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <span>Shipping</span>
            <span style={{ color: order.shipping === 0 ? "var(--success)" : "inherit" }}>
              {order.shipping === 0 ? "Free" : formatCurrency(order.shipping)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <span>GST</span><span>{formatCurrency(order.tax)}</span>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.2rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem" }}>
            <span>Total</span><span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="card">
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shipping address</p>
        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.7 }}>
          <strong>{order.shippingAddress.fullName}</strong> · {order.shippingAddress.phone}<br />
          {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
        </p>
      </div>

      {/* Customer ID */}
      <div className="card" style={{ padding: "0.9rem" }}>
        <p style={{ margin: "0 0 0.3rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Customer ID</p>
        <p style={{ margin: 0, fontSize: "0.82rem", fontFamily: "monospace", color: "var(--text-muted)" }}>{order.customerId}</p>
      </div>
    </div>
  );
}
