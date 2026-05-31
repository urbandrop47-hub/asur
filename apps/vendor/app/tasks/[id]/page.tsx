"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { VendorTask } from "@asur/types";
import { api } from "../../../lib/api";

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

const NEXT_STATUS: Record<string, VendorTask["status"] | null> = {
  pending: "in_progress",
  in_progress: "ready_to_ship",
  ready_to_ship: "completed",
  completed: null
};

const ACTION_LABEL: Record<string, string> = {
  in_progress: "Mark in progress",
  ready_to_ship: "Mark ready to ship",
  completed: "Mark shipped"
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<VendorTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracking form (only needed before marking completed)
  const [trackingId, setTrackingId] = useState("");
  const [courierName, setCourierName] = useState("");
  const [notes, setNotes] = useState("");
  const [showTracking, setShowTracking] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ data: VendorTask }>(`/api/v1/vendor/tasks/${id}`)
      .then((r) => {
        setTask(r.data);
        setNotes(r.data.notes ?? "");
        setTrackingId(r.data.trackingId ?? "");
        setCourierName(r.data.courierName ?? "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function advance() {
    if (!task) return;
    const next = NEXT_STATUS[task.status];
    if (!next) return;

    // For completed step, require tracking details
    if (next === "completed" && (!trackingId.trim() || !courierName.trim())) {
      setShowTracking(true);
      setError("Enter tracking ID and courier name before marking shipped.");
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const body: Record<string, string> = { status: next };
      if (trackingId.trim()) body.trackingId = trackingId.trim();
      if (courierName.trim()) body.courierName = courierName.trim();
      if (notes.trim()) body.notes = notes.trim();

      const res = await api.patch<{ data: VendorTask }>(`/api/v1/vendor/tasks/${id}`, body);
      setTask(res.data);
      setShowTracking(false);

      if (next === "completed") {
        router.push("/tasks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdating(false);
    }
  }

  async function saveNotes() {
    if (!task || !notes.trim()) return;
    setUpdating(true);
    try {
      const res = await api.patch<{ data: VendorTask }>(`/api/v1/vendor/tasks/${id}`, { notes: notes.trim() });
      setTask(res.data);
    } catch {
      setError("Failed to save notes");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ height: 40, width: "40%", borderRadius: 10, background: "rgba(255,255,255,0.05)" }} />
        <div style={{ height: 180, borderRadius: 14, background: "rgba(255,255,255,0.05)" }} />
      </div>
    );
  }

  if (notFound || !task) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
        <p>Task not found.</p>
        <Link href="/tasks" style={{ color: "var(--success)" }}>← Back to tasks</Link>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[task.status];
  const statusColor = STATUS_COLOR[task.status] ?? "var(--text-muted)";

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/tasks" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>← Tasks</Link>
      </div>

      {/* Status badge */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor }} />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: statusColor }}>
            {STATUS_LABEL[task.status]}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Updated {new Date(task.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Order info */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "1rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Order</p>
        <p style={{ margin: 0, fontSize: "0.85rem", fontFamily: "monospace", wordBreak: "break-all" }}>{task.orderId}</p>
      </div>

      {/* Tracking info (if set) */}
      {(task.trackingId || task.courierName) && (
        <div style={{ border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "1rem", background: "rgba(34,197,94,0.05)" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shipping info</p>
          {task.courierName && <p style={{ margin: "0 0 0.2rem", fontSize: "0.88rem", fontWeight: 600 }}>{task.courierName}</p>}
          {task.trackingId && <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{task.trackingId}</p>}
        </div>
      )}

      {/* Tracking form — shown when moving to completed */}
      {(showTracking || task.status === "ready_to_ship") && task.status !== "completed" && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "1rem", display: "grid", gap: "0.85rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Shipping details
          </p>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem", color: "var(--text-muted)" }}>
              Courier name *
            </label>
            <input
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="Delhivery / BlueDart / DTDC"
              style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.88rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem", color: "var(--text-muted)" }}>
              Tracking ID *
            </label>
            <input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="1Z999AA10123456784"
              style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.88rem", fontFamily: "monospace", outline: "none", boxSizing: "border-box" as const }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {task.status !== "completed" && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Packing notes, issues, etc."
            style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.85rem", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" as const }}
          />
          <button
            onClick={saveNotes}
            disabled={updating || !notes.trim()}
            style={{ padding: "0.5rem 1rem", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", alignSelf: "start" }}
          >
            Save notes
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.85rem", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Primary action */}
      {nextStatus && (
        <button
          onClick={advance}
          disabled={updating}
          style={{
            padding: "0.95rem", borderRadius: 999, fontWeight: 700, fontSize: "0.95rem",
            background: nextStatus === "completed"
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #38bdf8, #818cf8)",
            color: "#050706", border: "none", cursor: "pointer",
            fontFamily: "inherit", opacity: updating ? 0.6 : 1
          }}
        >
          {updating ? "Updating…" : ACTION_LABEL[nextStatus]}
        </button>
      )}

      {task.status === "completed" && (
        <div style={{ textAlign: "center", padding: "1rem", color: "var(--success)", fontWeight: 600 }}>
          ✓ Task completed — order marked as shipped
        </div>
      )}
    </div>
  );
}
