"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Order } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { useAuthStore } from "../../store/auth-store";
import { api } from "../../lib/api";

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
  draft: "var(--text-muted)",
  pending_payment: "var(--warning)",
  paid: "#3b82f6",
  processing: "var(--accent-3)",
  packed: "var(--accent-3)",
  shipped: "var(--success)",
  delivered: "var(--success)",
  cancelled: "var(--danger)"
};

function OrderCard({ order }: { order: Order }) {
  const dot = STATUS_COLOR[order.status] ?? "var(--text-muted)";
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <Link
      href={`/orders/${order.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "1rem",
        color: "var(--text)",
        transition: "border-color 0.15s"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{order.orderNumber}</p>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {order.items.length} {order.items.length === 1 ? "item" : "items"} · {date}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: dot }}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
      </div>
      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total</span>
        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{formatCurrency(order.total)}</span>
      </div>
    </Link>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { session, hydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Wait for localStorage to hydrate before deciding to redirect
    if (!hydrated) return;
    if (!session) {
      router.replace("/auth?next=/orders");
      return;
    }
    api
      .get<{ data: Order[] }>("/api/v1/orders")
      .then((r) => setOrders(r.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [session, hydrated, router]);

  if (!hydrated || !session) return null;

  if (loading) {
    return (
      <div style={{ maxWidth: 560, margin: "3rem auto", display: "grid", gap: "1rem", padding: "0 1rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 88, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <h2>Couldn&apos;t load orders</h2>
        <p>Something went wrong. Please try again.</p>
        <button className="badge" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        <h2>No orders yet</h2>
        <p>Your order history will appear here once you place an order.</p>
        <Link href="/products" className="badge">Start shopping</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: "2rem", padding: "2rem 1rem 4rem" }}>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 800 }}>Your orders</h1>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
