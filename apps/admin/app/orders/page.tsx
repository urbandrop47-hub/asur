"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { api } from "../../lib/api";

const STATUS_CLASS: Record<string, string> = {
  pending_payment: "badge warning",
  paid: "badge info",
  processing: "badge info",
  packed: "badge info",
  shipped: "badge success",
  delivered: "badge success",
  cancelled: "badge danger",
  draft: "badge draft"
};

type Tab = "all" | "paid" | "processing" | "shipped";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .get<{ data: Order[] }>("/api/v1/admin/orders")
      .then((r) => setOrders(r.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    tab === "all"
      ? orders
      : tab === "processing"
      ? orders.filter((o) => ["processing", "packed"].includes(o.status))
      : orders.filter((o) => o.status === tab);

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Orders</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {orders.length} total
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {(["all", "paid", "processing", "shipped"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.4rem 0.9rem", borderRadius: 999, border: "1px solid var(--border)",
              background: tab === t ? "rgba(56,189,248,0.12)" : "transparent",
              color: tab === t ? "var(--accent)" : "var(--text-muted)",
              fontSize: "0.8rem", fontWeight: tab === t ? 600 : 400, cursor: "pointer",
              textTransform: "capitalize", fontFamily: "inherit"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : error ? (
        <div className="empty-state">
          <h2>Failed to load orders</h2>
          <p>Could not reach the server. Check your connection and try again.</p>
          <button className="badge" onClick={load}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h2>No orders</h2>
          <p>{tab !== "all" ? `No ${tab} orders.` : "Orders will appear here once customers check out."}</p>
        </div>
      ) : (
        <div className="table-card">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 0.8fr 0.8fr 0.7fr", gap: "1rem", padding: "0.65rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            {["Order", "Customer", "Status", "Payment", "Total"].map((h) => (
              <span key={h} style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {filtered.map((o) => {
            const date = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                style={{
                  display: "grid", gridTemplateColumns: "1.2fr 1.5fr 0.8fr 0.8fr 0.7fr",
                  gap: "1rem", padding: "0.85rem 1.25rem",
                  borderBottom: "1px solid var(--border)", alignItems: "center", color: "var(--text)"
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem" }}>{o.orderNumber}</p>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>{date}</p>
                </div>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {o.customerId.slice(0, 16)}…
                </span>
                <span className={STATUS_CLASS[o.status] ?? "badge"}>{o.status.replace("_", " ")}</span>
                <span style={{ fontSize: "0.82rem", textTransform: "capitalize", color: "var(--text-muted)" }}>
                  {o.paymentStatus.replace("_", " ")}
                </span>
                <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{formatCurrency(o.total)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
