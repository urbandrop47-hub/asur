"use client";

import { useEffect, useState } from "react";
import type { Review } from "@asur/types";
import { api } from "../../lib/api";

type ReviewWithMeta = Review & { _moderating?: boolean };

function StarRow({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: 14, color: s <= rating ? "#f97316" : "rgba(255,255,255,0.15)" }}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const qs = filter === "all" ? "" : `?filter=${filter}`;
    api.get<{ data: { reviews: Review[]; total: number } }>(`/api/v1/admin/reviews${qs}`)
      .then((r) => { setReviews(r.data.reviews); setTotal(r.data.total); })
      .catch(() => setError("Failed to load reviews"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function moderate(id: string, action: "approve" | "reject") {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, _moderating: true } : r));
    try {
      await api.patch(`/api/v1/admin/reviews/${id}`, { action });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } catch {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, _moderating: false } : r));
    }
  }

  const chip = (label: string, value: typeof filter) => (
    <button
      onClick={() => setFilter(value)}
      style={{
        padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700,
        fontFamily: "var(--f-mono)", letterSpacing: "0.08em", textTransform: "uppercase",
        border: filter === value ? "1px solid rgba(249,115,22,0.5)" : "1px solid var(--border)",
        background: filter === value ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.03)",
        color: filter === value ? "var(--accent)" : "var(--text-muted)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: "1.5rem 1.5rem 4rem", maxWidth: 800 }}>
      <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.25rem", fontWeight: 800 }}>Review Moderation</h1>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        {total} review{total !== 1 ? "s" : ""} — approve to publish, reject to remove.
      </p>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {chip("Pending", "pending")}
        {chip("Approved", "approved")}
        {chip("All", "all")}
      </div>

      {error && (
        <div style={{ padding: "1rem", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)", marginBottom: "1rem", fontSize: "0.88rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14 }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          No {filter === "all" ? "" : filter} reviews.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                border: "1px solid var(--border)", borderRadius: 14, padding: "1rem 1.25rem",
                background: "rgba(255,255,255,0.02)",
                opacity: review._moderating ? 0.5 : 1,
                transition: "opacity 200ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <StarRow rating={review.rating} />
                    {review.approved && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "var(--success)" }}>
                        Approved
                      </span>
                    )}
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text)" }}>
                    {review.body}
                  </p>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--f-mono)" }}>
                    <span>Product: {review.productId.slice(-8)}</span>
                    <span>Customer: {review.customerId.slice(-8)}</span>
                    <span>Order: {review.orderId.slice(-8)}</span>
                  </div>
                </div>

                {!review.approved && (
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      onClick={() => moderate(review.id, "approve")}
                      disabled={review._moderating}
                      style={{
                        padding: "0.5rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700,
                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                        color: "var(--success)", cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => moderate(review.id, "reject")}
                      disabled={review._moderating}
                      style={{
                        padding: "0.5rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700,
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        color: "var(--danger)", cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {review.approved && (
                  <button
                    onClick={() => moderate(review.id, "reject")}
                    disabled={review._moderating}
                    style={{
                      padding: "0.5rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700,
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                      color: "var(--danger)", cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
