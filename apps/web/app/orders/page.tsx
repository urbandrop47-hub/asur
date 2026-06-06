"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Order } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { useAuthStore } from "../../store/auth-store";
import { api } from "../../lib/api";

const PTR_THRESHOLD = 72; // px to pull before triggering refresh

function usePullToRefresh(onRefresh: () => void) {
  const startY = useRef<number | null>(null); // null = gesture not started; 0 is a valid y coord
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(delta * 0.45, PTR_THRESHOLD + 16));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PTR_THRESHOLD && !refreshing) {
      setRefreshing(true);
      Promise.resolve(onRefresh()).finally(() => {
        setRefreshing(false);
      });
    }
    startY.current = null;
    setPullDistance(0);
  };

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }); // intentionally no deps — reads live state via closure via refs

  return { pullDistance, refreshing };
}

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

  function loadOrders() {
    return api
      .get<{ data: Order[] }>("/api/v1/orders")
      .then((r) => { setOrders(r.data ?? []); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  const { pullDistance, refreshing } = usePullToRefresh(loadOrders);

  useEffect(() => {
    // Wait for localStorage to hydrate before deciding to redirect
    if (!hydrated) return;
    if (!session) {
      router.replace("/auth?next=/orders");
      return;
    }
    loadOrders();
  }, [session, hydrated, router]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <button
          onClick={() => { setError(false); setLoading(true); void loadOrders(); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            borderRadius: 999, padding: "0.85rem 1.5rem",
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            color: "#130f0b", fontWeight: 700, fontSize: "0.92rem",
            border: "none", cursor: "pointer", minHeight: 48,
          }}
        >
          Try again
        </button>
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
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div style={{
          position: "fixed",
          top: "env(safe-area-inset-top, 0px)",
          left: 0, right: 0, zIndex: 100,
          display: "flex", justifyContent: "center", alignItems: "center",
          height: refreshing ? 48 : Math.max(pullDistance, 0),
          transition: refreshing ? "height 200ms ease" : "none",
          overflow: "hidden",
          background: "rgba(249,115,22,0.08)",
          borderBottom: "1px solid rgba(249,115,22,0.15)",
        }}>
          <span style={{
            fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent)",
            fontFamily: "var(--f-mono)",
            opacity: refreshing || pullDistance >= PTR_THRESHOLD ? 1 : pullDistance / PTR_THRESHOLD,
            transition: "opacity 150ms",
          }}>
            {refreshing ? "Refreshing…" : pullDistance >= PTR_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      )}
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 800 }}>Your orders</h1>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
