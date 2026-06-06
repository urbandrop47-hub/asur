"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { VendorTask } from "@asur/types";
import { api } from "../../lib/api";

type Filter = "all" | "pending" | "in_progress" | "ready_to_ship" | "completed";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  ready_to_ship: "Ready to ship",
  completed: "Completed"
};

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--warning)",
  in_progress: "#38bdf8",
  ready_to_ship: "#a78bfa",
  completed: "var(--success)"
};

function TaskCard({ task }: { task: VendorTask }) {
  const color = STATUS_COLOR[task.status] ?? "var(--text-muted)";
  const updated = new Date(task.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <Link
      href={`/tasks/${task.id}`}
      style={{
        display: "block", textDecoration: "none",
        border: "1px solid var(--border)", borderRadius: 14,
        padding: "1rem", color: "var(--text)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", fontFamily: "monospace" }}>
            {task.orderId.slice(0, 20)}…
          </p>
          {task.trackingId && (
            <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Tracking: {task.trackingId}
              {task.courierName ? ` · ${task.courierName}` : ""}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color }}>
            {STATUS_LABEL[task.status]}
          </span>
        </div>
      </div>
      <p style={{ margin: "0.6rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
        Updated {updated}
      </p>
      {task.notes && (
        <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
          {task.notes}
        </p>
      )}
    </Link>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<VendorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    api
      .get<{ data: VendorTask[] }>("/api/v1/vendor/tasks")
      .then((r) => setTasks(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    ready_to_ship: tasks.filter((t) => t.status === "ready_to_ship").length,
    completed: tasks.filter((t) => t.status === "completed").length
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>Fulfillment tasks</h1>
      </div>

      {/* Stats bar */}
      {!loading && !error && tasks.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Pending",  value: counts.pending,      color: "var(--warning)" },
            { label: "Packing",  value: counts.in_progress,  color: "#38bdf8" },
            { label: "Ready",    value: counts.ready_to_ship, color: "#a78bfa" },
            { label: "Shipped",  value: counts.completed,    color: "var(--success)" },
          ].map((s) => (
            <div key={s.label} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "0.75rem 0.85rem", background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
              <p style={{ margin: "0.1rem 0 0", fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {(["all", "pending", "in_progress", "ready_to_ship", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.4rem 0.85rem", borderRadius: 999, border: "1px solid var(--border)",
              background: filter === f ? "rgba(34,197,94,0.1)" : "transparent",
              color: filter === f ? "var(--success)" : "var(--text-muted)",
              fontSize: "0.78rem", fontWeight: filter === f ? 600 : 400, cursor: "pointer",
              whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0
            }}
          >
            {STATUS_LABEL[f] ?? "All"} {counts[f] > 0 && `(${counts[f]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: "rgba(255,255,255,0.05)", animation: "shimmer 1.4s infinite" }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          <p>Failed to load tasks. Check your token and try again.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: "0.75rem", padding: "0.6rem 1.25rem", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontFamily: "inherit" }}>
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          <p style={{ margin: 0 }}>
            {filter === "all" ? "No tasks yet. They appear when orders are paid." : `No ${STATUS_LABEL[filter]?.toLowerCase()} tasks.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {filtered.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      )}

      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
    </div>
  );
}
