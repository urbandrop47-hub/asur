"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { VendorTask } from "@asur/types";
import { api } from "../../../lib/api";

const STEPS: { status: VendorTask["status"]; label: string; hint: string }[] = [
  { status: "pending",       label: "Pick",  hint: "Locate and pull items from stock" },
  { status: "in_progress",   label: "Pack",  hint: "Pack securely with care instructions" },
  { status: "ready_to_ship", label: "Ship",  hint: "Hand off to courier with tracking" },
  { status: "completed",     label: "Done",  hint: "Order marked as shipped" },
];

const STEP_IDX: Record<string, number> = {
  pending: 0, in_progress: 1, ready_to_ship: 2, completed: 3
};

const ACTION_LABEL: Record<string, string> = {
  in_progress:   "Mark picked — start packing",
  ready_to_ship: "Mark packed — ready to ship",
  completed:     "Mark shipped",
};

const NEXT_STATUS: Record<string, VendorTask["status"] | null> = {
  pending: "in_progress", in_progress: "ready_to_ship", ready_to_ship: "completed", completed: null
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<VendorTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [courierName, setCourierName] = useState("");
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ data: VendorTask }>(`/api/v1/vendor/tasks/${id}`)
      .then((r) => {
        setTask(r.data);
        setNotes(r.data.notes ?? "");
        setNotesSaved(false);
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
    if (next === "completed" && (!trackingId.trim() || !courierName.trim())) {
      setError("Enter tracking ID and courier name before marking shipped.");
      return;
    }
    setUpdating(true);
    setError(null);
    try {
      const body: Record<string, string> = { status: next };
      if (trackingId.trim()) body.trackingId = trackingId.trim();
      if (courierName.trim()) body.courierName = courierName.trim();
      if (notes.trim()) body.notes = notes.trim(); // only send if non-empty — never wipe saved notes
      const res = await api.patch<{ data: VendorTask }>(`/api/v1/vendor/tasks/${id}`, body);
      setTask(res.data);
      if (next === "completed") router.push("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdating(false);
    }
  }

  async function saveNotes() {
    if (!task || !notes.trim()) return; // guard: never send empty notes
    setUpdating(true);
    setError(null);
    try {
      const res = await api.patch<{ data: VendorTask }>(`/api/v1/vendor/tasks/${id}`, {
        notes: notes.trim()
      });
      setTask(res.data);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      setError("Failed to save notes");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ height: 32, width: "35%", borderRadius: 8, background: "rgba(255,255,255,0.05)" }} />
        <div style={{ height: 88, borderRadius: 14, background: "rgba(255,255,255,0.05)" }} />
        <div style={{ height: 200, borderRadius: 14, background: "rgba(255,255,255,0.05)" }} />
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

  const currentStep = STEP_IDX[task.status] ?? 0;
  const nextStatus = NEXT_STATUS[task.status];
  const isComplete = task.status === "completed";

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <Link href="/tasks" style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
        ← All tasks
      </Link>

      {/* Order ID */}
      <div>
        <p style={{ margin: "0 0 0.15rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Order</p>
        <p style={{ margin: 0, fontSize: "0.9rem", fontFamily: "monospace", wordBreak: "break-all" }}>{task.orderId}</p>
      </div>

      {/* ── Step checklist ── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          const dotColor = isDone ? "var(--success)" : isActive ? "#38bdf8" : "var(--border)";
          const lineColor = isDone ? "var(--success)" : "rgba(255,255,255,0.06)";

          return (
            <div
              key={step.status}
              style={{
                display: "flex", alignItems: "flex-start", gap: "1rem",
                padding: "0.9rem 1.1rem",
                background: isActive ? "rgba(56,189,248,0.04)" : "transparent",
                borderBottom: i < STEPS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Track dot + line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 3 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                  background: isDone ? "var(--success)" : isActive ? "transparent" : "rgba(255,255,255,0.06)",
                  border: `2px solid ${dotColor}`,
                  boxShadow: isActive ? "0 0 0 3px rgba(56,189,248,0.18)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {isDone && (
                    <svg width="7" height="7" viewBox="0 0 7 7" fill="none" aria-hidden="true">
                      <path d="M1 3.5L3 5.5L6 1.5" stroke="#050706" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 18, background: lineColor, margin: "3px 0" }} />
                )}
              </div>

              {/* Step content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.88rem", fontWeight: isActive ? 700 : 500,
                    color: isDone ? "var(--text-muted)" : isActive ? "var(--text)" : "rgba(255,255,255,0.35)"
                  }}>
                    {step.label}
                  </span>
                  {isActive && (
                    <span style={{
                      fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                      background: "rgba(56,189,248,0.15)", color: "#38bdf8",
                      textTransform: "uppercase", letterSpacing: "0.07em"
                    }}>
                      Current
                    </span>
                  )}
                  {isDone && (
                    <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>✓</span>
                  )}
                </div>
                {(isDone || isActive) && (
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {step.hint}
                  </p>
                )}

                {/* Tracking fields inline in the Ship step */}
                {isActive && step.status === "ready_to_ship" && (
                  <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.6rem" }}>
                    <input
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="Courier (Delhivery, BlueDart…)"
                      style={{ padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.85rem", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    <input
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="Tracking ID"
                      style={{ padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.85rem", fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tracking summary (once set) */}
      {isComplete && task.trackingId && (
        <div style={{ border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "1rem", background: "rgba(34,197,94,0.05)" }}>
          <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shipped via</p>
          {task.courierName && <p style={{ margin: "0 0 0.2rem", fontSize: "0.9rem", fontWeight: 700 }}>{task.courierName}</p>}
          <p style={{ margin: 0, fontSize: "0.82rem", fontFamily: "monospace", color: "var(--text-muted)" }}>{task.trackingId}</p>
        </div>
      )}

      {/* Notes */}
      {!isComplete && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesSaved(false);
            }}
            rows={2}
            placeholder="Packing notes, issues, substitutions…"
            style={{ padding: "0.65rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.85rem", fontFamily: "inherit", outline: "none", resize: "vertical", width: "100%", boxSizing: "border-box" }}
          />
          <button
            onClick={saveNotes}
            disabled={updating}
            style={{ padding: "0.45rem 1rem", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: notesSaved ? "var(--success)" : "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", alignSelf: "start", transition: "color 0.15s" }}
          >
            {notesSaved ? "✓ Saved" : "Save notes"}
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.85rem", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Primary CTA */}
      {nextStatus && (
        <button
          onClick={advance}
          disabled={updating}
          style={{
            padding: "1rem", borderRadius: 999, fontWeight: 700, fontSize: "0.95rem",
            background: nextStatus === "completed"
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #38bdf8, #818cf8)",
            color: "#050706", border: "none", cursor: updating ? "wait" : "pointer",
            fontFamily: "inherit", opacity: updating ? 0.65 : 1, transition: "opacity 0.15s"
          }}
        >
          {updating ? "Updating…" : ACTION_LABEL[nextStatus]}
        </button>
      )}

      {isComplete && (
        <div style={{ textAlign: "center", padding: "1rem", color: "var(--success)", fontWeight: 600, fontSize: "0.9rem" }}>
          ✓ Order shipped successfully
        </div>
      )}
    </div>
  );
}
