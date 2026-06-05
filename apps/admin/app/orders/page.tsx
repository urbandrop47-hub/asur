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
type BulkAction = "shipped" | "delivered" | "export-csv";

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }

function ordersToCSV(orders: Order[]): string {
  const header = ["Order Number", "Date", "Customer ID", "Items", "Subtotal", "Discount", "Shipping", "GST", "Total", "Status", "Payment"];
  const rows = orders.map((o) => {
    const items = (o.items ?? []).map((i) => `${i.title} x${i.quantity}`).join(" | ");
    return [
      o.orderNumber, String(o.createdAt).slice(0, 10), o.customerId,
      `"${items.replace(/"/g, '""')}"`,
      o.subtotal, o.discount ?? 0, o.shipping, o.tax, o.total, o.status, o.paymentStatus
    ].join(",");
  });
  return [header.join(","), ...rows].join("\r\n");
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    setSelected(new Set());
    api
      .get<{ data: Order[] }>("/api/v1/admin/orders")
      .then((r) => setOrders(r.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered =
    tab === "all" ? orders
    : tab === "processing" ? orders.filter((o) => ["processing", "packed"].includes(o.status))
    : orders.filter((o) => o.status === tab);

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); filtered.forEach((o) => n.delete(o.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); filtered.forEach((o) => n.add(o.id)); return n; });
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleBulkAction(action: BulkAction) {
    const ids = [...selected];
    if (ids.length === 0) return;

    if (action === "export-csv") {
      const toExport = orders.filter((o) => ids.includes(o.id));
      const csv = ordersToCSV(toExport);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asur-orders-${isoDay(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    setBulkLoading(true);
    try {
      await api.post("/api/v1/admin/orders/bulk-status", { ids, status: action });
      load();
    } catch {
      alert("Bulk action failed. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  }

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
            onClick={() => { setTab(t); setSelected(new Set()); }}
            style={{
              padding: "0.4rem 0.9rem", borderRadius: 999, border: "1px solid var(--border)",
              background: tab === t ? "rgba(56,189,248,0.12)" : "transparent",
              color: tab === t ? "var(--accent)" : "var(--text-muted)",
              fontSize: "0.8rem", fontWeight: tab === t ? 600 : 400, cursor: "pointer",
              textTransform: "capitalize", fontFamily: "inherit"
            }}
          >{t}</button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.65rem 1.25rem", marginBottom: "0.75rem",
          border: "1px solid rgba(56,189,248,0.3)", borderRadius: 12,
          background: "rgba(56,189,248,0.07)"
        }}>
          <span style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600 }}>
            {selected.size} selected
          </span>
          <button
            disabled={bulkLoading}
            onClick={() => handleBulkAction("shipped")}
            style={{ padding: "0.35rem 0.8rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
          >Mark Shipped</button>
          <button
            disabled={bulkLoading}
            onClick={() => handleBulkAction("delivered")}
            style={{ padding: "0.35rem 0.8rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
          >Mark Delivered</button>
          <button
            onClick={() => handleBulkAction("export-csv")}
            style={{ padding: "0.35rem 0.8rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
          >Export CSV</button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ marginLeft: "auto", padding: "0.35rem 0.8rem", borderRadius: 8, border: "none", background: "transparent", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}
          >Clear</button>
        </div>
      )}

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
          <div style={{ display: "grid", gridTemplateColumns: "32px 1.2fr 1.5fr 0.8fr 0.8fr 0.7fr", gap: "1rem", padding: "0.65rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ cursor: "pointer", accentColor: "var(--accent)" }}
            />
            {["Order", "Customer", "Status", "Payment", "Total"].map((h) => (
              <span key={h} style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>

          {filtered.map((o) => {
            const date = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            const isSelected = selected.has(o.id);
            return (
              <div
                key={o.id}
                style={{
                  display: "grid", gridTemplateColumns: "32px 1.2fr 1.5fr 0.8fr 0.8fr 0.7fr",
                  gap: "1rem", padding: "0.85rem 1.25rem",
                  borderBottom: "1px solid var(--border)", alignItems: "center",
                  background: isSelected ? "rgba(56,189,248,0.04)" : undefined
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(o.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: "pointer", accentColor: "var(--accent)" }}
                />
                <Link href={`/orders/${o.id}`} style={{ display: "contents", color: "var(--text)" }}>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
