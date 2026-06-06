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

// Statuses admin can set (not pending_payment/draft — those are system-set)
const UPDATABLE_STATUSES = ["processing", "packed", "shipped", "delivered"] as const;

function getDefaultAdminStatus(status: Order["status"]) {
  return status === "paid" ? "processing" : status;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      title="Copy to clipboard"
      style={{
        padding: "0.2rem 0.55rem", borderRadius: 6, border: "1px solid var(--border)",
        background: "transparent", color: copied ? "var(--success, #22c55e)" : "var(--text-muted)",
        fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
        transition: "color 0.15s"
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadOrder = () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    setStatusMsg(null);
    api
      .get<{ data: Order }>(`/api/v1/admin/orders/${id}`)
      .then((r) => { setOrder(r.data); setNextStatus(getDefaultAdminStatus(r.data.status)); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrder(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusUpdate() {
    if (!order || !nextStatus || nextStatus === order.status) return;
    setStatusSaving(true);
    setStatusMsg(null);
    try {
      await api.post("/api/v1/admin/orders/bulk-status", { ids: [order.id], status: nextStatus });
      setOrder((o) => o ? { ...o, status: nextStatus as Order["status"] } : o);
      setStatusMsg({ ok: true, text: `Status updated to "${STATUS_LABEL[nextStatus] ?? nextStatus}"` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg({ ok: false, text: "Failed to update status" });
    } finally {
      setStatusSaving(false);
    }
  }

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

  const canUpdateStatus = !["cancelled", "pending_payment", "draft"].includes(order.status);

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
                setTimeout(() => URL.revokeObjectURL(url), 10000);
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

      {/* Status update */}
      {canUpdateStatus && (
        <div className="card" style={{ padding: "0.9rem" }}>
          <p style={{ margin: "0 0 0.6rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Update Status
          </p>
          <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              style={{
                flex: 1, minWidth: 140, padding: "0.55rem 0.75rem", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
                color: "var(--text)", fontSize: "0.9rem", fontFamily: "inherit", outline: "none"
              }}
            >
              {UPDATABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={statusSaving || nextStatus === order.status}
              style={{
                padding: "0.55rem 1.1rem", borderRadius: 8, border: "none",
                background: nextStatus !== order.status ? "linear-gradient(135deg,#f97316,#fb7185)" : "rgba(255,255,255,0.07)",
                color: nextStatus !== order.status ? "#130f0b" : "var(--text-muted)",
                fontWeight: 700, fontSize: "0.85rem", cursor: nextStatus !== order.status ? "pointer" : "default",
                fontFamily: "inherit", opacity: statusSaving ? 0.65 : 1, transition: "all 0.15s"
              }}
            >
              {statusSaving ? "Saving…" : "Save"}
            </button>
          </div>
          {statusMsg && (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: statusMsg.ok ? "var(--success,#22c55e)" : "var(--danger,#ef4444)" }}>
              {statusMsg.ok ? "✓ " : "✗ "}{statusMsg.text}
            </p>
          )}
        </div>
      )}

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

      {/* Tracking info */}
      {order.trackingNumber && (
        <div className="card" style={{ padding: "0.9rem", borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.04)" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--success,#22c55e)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Shipment
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            {order.courierName && (
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{order.courierName}</span>
            )}
            <span style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
              {order.trackingNumber}
            </span>
            <CopyButton text={order.trackingNumber} />
          </div>
        </div>
      )}

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

      {/* IDs */}
      <div className="card" style={{ padding: "0.9rem", display: "grid", gap: "0.75rem" }}>
        {[
          { label: "Order ID", value: order.id },
          { label: "Customer ID", value: order.customerId }
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ margin: "0 0 0.3rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontFamily: "monospace", color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
              <CopyButton text={value} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
