"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, Review } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { ProductImageGallery } from "../../../components/product-image-gallery";
import { SizeGuideModal } from "../../../components/size-guide-modal";
import { useCartStore } from "../../../store/cart-store";
import { useAuthStore } from "../../../store/auth-store";
import { track } from "../../../lib/analytics";
import { api } from "../../../lib/api";
import { StarRating, InteractiveStars } from "../../../components/star-rating";
import { HeartButton } from "../../../components/heart-button";
import { ProductCard } from "../../../components/product-card";
import { recordView } from "../../../lib/recently-viewed";
import { getLowestVariantPrice, hasVariants } from "../../../lib/product-utils";
import { useStockStream } from "../../../lib/use-stock-stream";

const FIT_DESCRIPTIONS: Record<string, string> = {
  regular:  "Classic silhouette — follows the body without being tight. True to size.",
  oversized:"Intentionally cut 2 sizes larger for a relaxed, dropped-shoulder look. Size down if in doubt.",
  boxy:     "Cropped and boxy — hits at the hip with a square cut. Consider sizing up in length-sensitive looks.",
  relaxed:  "Slightly loose through the body with a comfortable drape. Generally true to size."
};

type ReviewAggregate = { averageRating: number; count: number };

// ─── Back-in-stock notification form ────────────────────────────────────────
function BackInStockForm({ productId, variantSku }: { productId: string; variantSku: string }) {
  const { session } = useAuthStore();
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/v1/stock-alerts", { productId, variantSku, email });
      setDone(true);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{
        padding: "0.85rem 1rem", borderRadius: 12,
        background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
        color: "var(--success)", fontSize: "0.88rem", animation: "fadeInUp 0.3s ease both",
      }}>
        ✓ You&apos;ll be notified at <strong>{email}</strong> when this variant is back in stock.
      </div>
    );
  }

  return (
    <div style={{
      padding: "0.85rem 1rem", borderRadius: 12,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      animation: "fadeInUp 0.3s ease both",
    }}>
      <p style={{ margin: "0 0 0.65rem", fontSize: "0.83rem", fontWeight: 600 }}>
        Notify me when back in stock
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            flex: 1, minWidth: 180, padding: "0.6rem 0.85rem", borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)",
            color: "var(--text)", fontSize: "0.88rem", outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.6rem 1.2rem", borderRadius: 999, fontWeight: 700, fontSize: "0.85rem",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            color: "var(--text)", cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "…" : "Notify me"}
        </button>
      </form>
      {error && <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}

function ReviewsSection({ slug, productId }: { slug: string; productId: string }) {
  const { session } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Photo upload
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    api.get<{ data: { reviews: Review[]; aggregate: ReviewAggregate } }>(`/api/v1/products/${slug}/reviews`)
      .then((r) => { setReviews(r.data.reviews); setAggregate(r.data.aggregate); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleImageUpload(file: File) {
    if (imageUrls.length >= 3) return;
    // Validate type client-side before hitting the backend
    const ACCEPTED = ["image/jpeg", "image/png", "image/webp"] as const;
    if (!ACCEPTED.includes(file.type as typeof ACCEPTED[number])) {
      setError("Only JPEG, PNG, or WebP images are supported.");
      return;
    }
    const contentType = file.type as "image/jpeg" | "image/png" | "image/webp";
    setUploadingImage(true);
    try {
      const { data } = await api.post<{ data: { uploadUrl: string; publicUrl: string } }>(
        "/api/v1/reviews/upload-url",
        { contentType }
      );
      const resp = await fetch(data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
      if (!resp.ok) throw new Error(`Upload failed (${resp.status})`);
      setImageUrls((prev) => [...prev, data.publicUrl]);
    } catch {
      setError("Image upload failed. Try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    if (body.length < 10) { setError("Review must be at least 10 characters"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/v1/reviews", { productId, orderId, rating, body, images: imageUrls });
      setSubmitted(true);
      setShowForm(false);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const divider = <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1.25rem 0" }} />;

  return (
    <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            Customer Reviews
          </h2>
          {aggregate && aggregate.count > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StarRating rating={aggregate.averageRating} showValue count={aggregate.count} />
            </div>
          ) : !loading ? (
            <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>No reviews yet. Be the first.</p>
          ) : null}
        </div>
        {session && !submitted && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "0.55rem 1.1rem", borderRadius: 999, fontSize: "0.83rem", fontWeight: 700,
              border: "1px solid rgba(249,115,22,0.4)", color: "var(--accent)",
              background: "rgba(249,115,22,0.06)", cursor: "pointer",
            }}
          >
            Write a review
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div style={{
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.25rem",
          marginBottom: "1.5rem", background: "rgba(255,255,255,0.02)",
          animation: "fadeInUp 0.25s ease both",
        }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "0.92rem", fontWeight: 700 }}>Your review</h3>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
            <div>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Rating</p>
              <InteractiveStars value={rating} onChange={setRating} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                Order ID <span style={{ fontWeight: 400, textTransform: "none" }}>(required to verify purchase)</span>
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Find it in your orders page"
                required
                style={{
                  width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, boxSizing: "border-box",
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
                  color: "var(--text)", fontSize: "0.88rem", outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                Review
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What did you think? Fit, fabric, print quality…"
                rows={4}
                style={{
                  width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, boxSizing: "border-box",
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
                  color: "var(--text)", fontSize: "0.88rem", outline: "none", resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {body.length}/2000
              </p>
            </div>
            {/* Photo upload */}
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                Photos <span style={{ fontWeight: 400, textTransform: "none" }}>(optional, up to 3)</span>
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {imageUrls.map((url, i) => (
                  <div key={url} style={{ position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Upload ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => setImageUrls((p) => p.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", fontSize: "10px", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                      aria-label="Remove image"
                    >✕</button>
                  </div>
                ))}
                {imageUrls.length < 3 && (
                  <label style={{ width: 72, height: 72, borderRadius: 10, border: "1px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingImage ? "wait" : "pointer", color: "var(--text-muted)", fontSize: "1.2rem", background: "rgba(255,255,255,0.02)" }}>
                    {uploadingImage ? "…" : "+"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      disabled={uploadingImage}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageUpload(f); e.target.value = ""; }}
                    />
                  </label>
                )}
              </div>
            </div>
            {error && <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--danger)" }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "0.7rem 1.4rem", borderRadius: 999, fontWeight: 700, fontSize: "0.88rem",
                  background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", cursor: "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting…" : "Submit review"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "0.7rem 1.1rem", borderRadius: 999, fontWeight: 600, fontSize: "0.88rem",
                  border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-muted)", cursor: "pointer",
                  background: "none",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {submitted && (
        <div style={{
          padding: "1rem 1.25rem", borderRadius: 12, marginBottom: "1.5rem",
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          color: "var(--success)", fontSize: "0.88rem",
        }}>
          ✓ Review submitted — it will appear once our team approves it.
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : reviews.length === 0 ? (
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
          {aggregate?.count === 0 ? "No reviews yet." : "No approved reviews yet."}
        </p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {reviews.map((review) => (
            <div key={review.id} style={{
              padding: "1rem 1.25rem", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)",
            }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <StarRating rating={review.rating} size={14} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {review.verifiedPurchase && (
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                    color: "var(--success)", letterSpacing: "0.05em", textTransform: "uppercase"
                  }}>
                    ✓ Verified
                  </span>
                )}
              </div>
              {/* Body */}
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.65, color: "var(--text)" }}>{review.body}</p>
              {/* Photos */}
              {review.images?.length > 0 && (
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                  {review.images.map((url) => (
                    <div key={url} style={{ width: 72, height: 72, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Review photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
              {/* Helpfulness */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Helpful?</span>
                <button
                  onClick={() => session && api.post(`/api/v1/reviews/${review.id}/helpful`, { vote: "up" })
                    .then((r) => setReviews((prev) => prev.map((rv) => rv.id === review.id ? (r as { data: Review }).data : rv)))
                    .catch(() => {})}
                  style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "2px 8px", fontSize: "0.72rem", color: "var(--text-muted)", cursor: session ? "pointer" : "default" }}
                >
                  👍 {review.helpfulVotes ?? 0}
                </button>
                <button
                  onClick={() => session && api.post(`/api/v1/reviews/${review.id}/helpful`, { vote: "down" })
                    .then((r) => setReviews((prev) => prev.map((rv) => rv.id === review.id ? (r as { data: Review }).data : rv)))
                    .catch(() => {})}
                  style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "2px 8px", fontSize: "0.72rem", color: "var(--text-muted)", cursor: session ? "pointer" : "default" }}
                >
                  👎 {review.unhelpfulVotes ?? 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Size Recommendation ──────────────────────────────────────────────────

function AiSizeRec({ sizes, onSelect }: { sizes: string[]; onSelect: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fit, setFit] = useState("regular");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ size: string; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<{ data: { size: string; reason: string } }>("/api/v1/ai/size-rec", {
        height: Number(height), weight: Number(weight), fit, sizes,
      });
      setResult(res.data);
    } catch {
      setError("Could not get a recommendation. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputSt: React.CSSProperties = {
    flex: 1, padding: "0.55rem 0.75rem", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
    color: "var(--text)", fontSize: "0.88rem", outline: "none", minWidth: 0,
  };

  return (
    <div style={{ marginTop: "0.75rem" }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 2 }}
        >
          ✦ Not sure of your size? Find it with AI
        </button>
      ) : (
        <div style={{ padding: "0.85rem", borderRadius: 12, background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.18)", animation: "fadeInUp 0.2s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.65rem" }}>
            <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>AI Size Finder</p>
            <button onClick={() => { setOpen(false); setResult(null); setError(null); }} aria-label="Close size finder" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", padding: "0.2rem" }}>✕</button>
          </div>
          {result ? (
            <div>
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.95rem", fontWeight: 800 }}>
                Recommended: <span style={{ color: "var(--accent)" }}>{result.size}</span>
              </p>
              <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{result.reason}</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => { onSelect(result.size); setOpen(false); }}
                  style={{ flex: 1, padding: "0.55rem", borderRadius: 999, fontWeight: 700, fontSize: "0.82rem", background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", border: "none", cursor: "pointer" }}
                >
                  Select {result.size}
                </button>
                <button onClick={() => setResult(null)} style={{ padding: "0.55rem 0.75rem", borderRadius: 999, fontSize: "0.78rem", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.2rem", fontWeight: 600 }}>Height (cm)</label>
                  <input style={inputSt} type="number" min={140} max={220} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.2rem", fontWeight: 600 }}>Weight (kg)</label>
                  <input style={inputSt} type="number" min={40} max={200} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" required />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.2rem", fontWeight: 600 }}>Preferred fit</label>
                <select value={fit} onChange={(e) => setFit(e.target.value)} style={{ ...inputSt, width: "100%", appearance: "none" as const }}>
                  <option value="slim">Slim — fitted to body</option>
                  <option value="regular">Regular — relaxed, not oversized</option>
                  <option value="loose">Loose — intentionally oversized</option>
                </select>
              </div>
              {error && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--danger)" }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ padding: "0.6rem", borderRadius: 999, fontWeight: 700, fontSize: "0.85rem", background: loading ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", border: "none", cursor: loading ? "wait" : "pointer" }}>
                {loading ? "Thinking…" : "Find my size"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function stockLabel(stock: number) {
  if (stock === 0) return { text: "Out of stock", color: "var(--danger)" };
  if (stock < 5) return { text: `Only ${stock} left`, color: "var(--warning)" };
  return { text: "In stock", color: "var(--success)" };
}

export function ProductDetailClient({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atcRef = useRef<HTMLDivElement | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  // Live stock via SSE — falls back to initial variant data if unavailable
  const { stockMap, live: stockLive } = useStockStream(product.slug, product.variants);

  useEffect(() => {
    track("product_viewed", { id: product.id, slug: product.slug, title: product.title });
    recordView(product);
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, [product.id, product.slug, product.title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sticky ATC: show bar when the main ATC button scrolls out of view
  useEffect(() => {
    const el = atcRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const productHasVariants = hasVariants(product);

  const selectedVariant =
    selectedSize && selectedColor
      ? product.variants.find((v) => v.size === selectedSize && v.color === selectedColor)
      : null;

  // Use live stockMap (SSE) over static variant.stock
  const variantStock = selectedVariant ? (stockMap[selectedVariant.sku] ?? selectedVariant.stock) : null;
  const displayPrice = selectedVariant
    ? selectedVariant.price
    : getLowestVariantPrice(product);
  const comparePrice =
    selectedVariant?.compareAtPrice ??
    (productHasVariants && product.variants.every((v) => v.compareAtPrice)
      ? Math.min(...product.variants.map((v) => v.compareAtPrice!))
      : undefined);

  const stockInfo = variantStock !== null ? stockLabel(variantStock) : null;
  // Preorder products are always addable (stock may be 0 by design)
  const canAddToCart = !!selectedVariant && (product.status === "preorder" || variantStock !== 0);
  const comingSoon = !productHasVariants;

  function isComboAvailable(size: string, color: string) {
    return product.variants.some((v) => v.size === size && v.color === color && (stockMap[v.sku] ?? v.stock) > 0);
  }

  const pickerBtn = (selected: boolean, available: boolean): React.CSSProperties => ({
    minWidth: 52, minHeight: 44, padding: "0.45rem 0.9rem", borderRadius: 10,
    border: selected ? "2px solid var(--accent)" : "1px solid rgba(255,255,255,0.14)",
    background: selected ? "rgba(249,115,22,0.12)" : available ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
    color: "var(--text)",
    fontWeight: selected ? 700 : 500, fontSize: "0.88rem",
    cursor: available ? "pointer" : "not-allowed",
    opacity: available ? 1 : 0.32,
    transition: "border-color 150ms ease, background 150ms ease, transform 100ms ease, opacity 150ms ease",
    transform: selected ? "scale(1.04)" : "scale(1)",
  });

  return (
    <div style={{ animation: "fadeInUp 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
      {/* Breadcrumb */}
      <nav style={{
        display: "flex", gap: "0.5rem", alignItems: "center",
        marginBottom: "1.75rem", color: "var(--text-muted)", fontSize: "0.82rem",
      }}>
        <Link href="/products" style={{ textDecoration: "none", color: "inherit" }}>
          Products
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: "var(--text)" }}>{product.title}</span>
      </nav>

      <div className="pdp-layout">
        {/* Gallery */}
        <div className="pdp-gallery">
          <ProductImageGallery media={product.media} videos={product.videos} title={product.title} />
        </div>

        {/* Info panel */}
        <div className="pdp-info">
          {/* Badges */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{
              padding: "0.28rem 0.7rem", borderRadius: 999,
              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
              color: "#bfdbfe", fontSize: "0.7rem", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              {product.category}
            </span>
            {product.drop && (
              <span style={{
                padding: "0.28rem 0.7rem", borderRadius: 999,
                background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)",
                color: "#fed7aa", fontSize: "0.7rem", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {product.drop.name}
              </span>
            )}
            {product.fit && (
              <span style={{
                padding: "0.28rem 0.7rem", borderRadius: 999,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {product.fit}
              </span>
            )}
          </div>

          {/* Title + description */}
          <div>
            <h1 style={{ margin: "0 0 0.6rem", fontSize: "clamp(1.5rem, 3vw, 2.1rem)", fontWeight: 800, lineHeight: 1.15 }}>
              {product.title}
            </h1>
            <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7, fontSize: "0.93rem" }}>
              {product.description}
            </p>
          </div>

          {/* Fabric & craft */}
          <div style={{
            padding: "0.9rem 1rem", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)"
          }}>
            <p style={{ margin: "0 0 0.7rem", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Fabric &amp; craft
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem 1.25rem" }}>
              {[
                { label: "Weight",      value: "230 GSM" },
                { label: "Composition", value: "100% combed cotton" },
                { label: "Finish",      value: "Drop-washed" },
                { label: "Print",       value: "Water-based screen" },
                { label: "Pre-shrunk",  value: "Yes" },
                { label: "Wash care",   value: "Cold, inside-out" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>{label}</p>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Price + stock */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span className="pdp-price">
                {comingSoon
                  ? "Coming soon"
                  : <>
                      {product.variants.length > 1 && !selectedVariant ? "from " : ""}
                      {displayPrice !== null ? formatCurrency(displayPrice) : "Price unavailable"}
                    </>
                }
              </span>
              {comparePrice !== undefined && displayPrice !== null && comparePrice > displayPrice && (
                <s style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>
                  {formatCurrency(comparePrice)}
                </s>
              )}
            </div>
            {stockInfo && (
              <span className="pdp-stock">
                <span className="pdp-stock-dot" style={{ background: stockInfo.color }} />
                <span style={{ color: stockInfo.color, fontSize: "0.82rem", fontWeight: 600 }}>
                  {stockInfo.text}
                </span>
              </span>
            )}
            {/* Live indicator — shown once SSE connects */}
            {stockLive && (
              <span title="Stock updates in real-time" style={{
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                fontSize: "0.68rem", color: "rgba(246,241,234,0.35)",
                fontFamily: "var(--f-mono)", letterSpacing: "0.06em",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--success)",
                  boxShadow: "0 0 0 2px rgba(34,197,94,0.2)",
                  animation: "pulse 2s infinite",
                }} />
                LIVE
              </span>
            )}
          </div>

          {/* Pre-order banner */}
          {product.status === "preorder" && (
            <div style={{
              padding: "0.85rem 1rem", borderRadius: 12,
              background: "rgba(249,115,22,0.07)",
              border: "1px solid rgba(249,115,22,0.2)",
              display: "grid", gap: "0.3rem",
            }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.83rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                📦 Pre-order
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(246,241,234,0.7)", lineHeight: 1.5 }}>
                {product.preorderNote ?? (product.preorderShipDate
                  ? `Estimated ship: ${new Date(product.preorderShipDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Pay now. We'll ship as soon as it's ready.")}
              </p>
            </div>
          )}

          <hr className="pdp-divider" />

          {/* Size picker */}
          {sizes.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Size
                  {selectedSize
                    ? <span style={{ color: "var(--text)", marginLeft: "0.4rem" }}>— {selectedSize}</span>
                    : <span style={{ color: "rgba(246,241,234,0.35)", marginLeft: "0.4rem", fontWeight: 400 }}>— select one</span>}
                </p>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  Size guide
                </button>
              </div>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {sizes.map((size) => {
                  const available = selectedColor
                    ? isComboAvailable(size, selectedColor)
                    : product.variants.some((v) => v.size === size && (stockMap[v.sku] ?? v.stock) > 0);
                  const selected = selectedSize === size;
                  return (
                    <button key={size} onClick={() => { setSelectedSize(selected ? null : size); if (!selected) track("size_selected", { size, slug: product.slug }); }} disabled={!available} style={pickerBtn(selected, available)}>
                      {size}
                    </button>
                  );
                })}
              </div>
              {/* Fit description */}
              {product.fit && FIT_DESCRIPTIONS[product.fit] && (
                <p style={{ margin: "0.6rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--text)", textTransform: "capitalize" }}>{product.fit} fit</strong>
                  {" — "}{FIT_DESCRIPTIONS[product.fit]}
                </p>
              )}
              {/* AI size rec */}
              <AiSizeRec sizes={sizes} onSelect={(s) => { setSelectedSize(s); track("size_rec_used", { slug: product.slug, result: s }); }} />
            </div>
          )}

          {/* Color picker */}
          {colors.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Color
                {selectedColor
                  ? <span style={{ color: "var(--text)", marginLeft: "0.4rem" }}>— {selectedColor}</span>
                  : <span style={{ color: "rgba(246,241,234,0.35)", marginLeft: "0.4rem", fontWeight: 400 }}>— select one</span>}
              </p>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {colors.map((color) => {
                  const available = selectedSize
                    ? isComboAvailable(selectedSize, color)
                    : product.variants.some((v) => v.color === color && (stockMap[v.sku] ?? v.stock) > 0);
                  const selected = selectedColor === color;
                  return (
                    <button key={color} onClick={() => { setSelectedColor(selected ? null : color); if (!selected) track("color_selected", { color, slug: product.slug }); }} disabled={!available} style={pickerBtn(selected, available)}>
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKU chip */}
          {selectedVariant && (
            <div style={{
              padding: "0.6rem 0.9rem", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              fontSize: "0.8rem", color: "var(--text-muted)",
              animation: "fadeInUp 0.25s ease both",
            }}>
              SKU: <span style={{ color: "var(--text)", fontFamily: "var(--f-mono)", letterSpacing: "0.04em" }}>{selectedVariant.sku}</span>
            </div>
          )}

          <hr className="pdp-divider" />

          {/* Add to cart + Wishlist — observed by IntersectionObserver for sticky bar */}
          <div ref={atcRef} style={{ display: "flex", gap: "0.6rem", alignItems: "stretch" }}>
          <button
            className="btn-full btn-primary"
            disabled={!canAddToCart}
            style={{
              flex: 1,
              fontSize: "1rem",
              background: added
                ? "rgba(34,197,94,0.85)"
                : canAddToCart
                  ? "linear-gradient(135deg, #f97316, #fb7185)"
                  : "rgba(255,255,255,0.07)",
              color: canAddToCart || added ? "#130f0b" : "var(--text-muted)",
              cursor: canAddToCart ? "pointer" : "not-allowed",
              transition: "background 300ms ease, transform 120ms ease",
            }}
            onClick={() => {
              if (!selectedVariant) return;
              addItem({
                productId: product.id,
                productTitle: product.title,
                productSlug: product.slug,
                imageUrl: product.media?.[0]?.url,
                variantSku: selectedVariant.sku,
                unitPrice: selectedVariant.price,
                quantity: 1,
                size: selectedVariant.size,
                color: selectedVariant.color,
                maxStock: variantStock ?? selectedVariant.stock, // use live stock value
              });
              // Note: add_to_cart event is also fired inside addItem() in cart-store — don't double-fire here
              setAdded(true);
              if (addedTimer.current) clearTimeout(addedTimer.current);
              addedTimer.current = setTimeout(() => setAdded(false), 2200);
            }}
          >
            {added
              ? "✓ Added to cart"
              : !selectedSize || !selectedColor
                ? "Select size & color"
                : variantStock === 0
                  ? "Out of stock"
                  : product.status === "preorder"
                    ? "Pre-order now"
                    : "Add to cart"}
          </button>
          <HeartButton product={product} size={20} />
          </div>

          {/* Buy now / View cart — same height slot, no layout shift */}
          <div style={{ minHeight: 48, position: "relative" }}>
            {added ? (
              <Link href="/cart" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", minHeight: 48, borderRadius: 999,
                border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.06)",
                color: "var(--success)", fontSize: "0.88rem", fontWeight: 600,
                textDecoration: "none", gap: 6,
                animation: "fadeInUp 0.2s ease both",
              }}>
                View cart
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ) : (
              <button
                onClick={() => {
                  if (!selectedVariant) return;
                  addItem({
                    productId: product.id,
                    productTitle: product.title,
                    productSlug: product.slug,
                    imageUrl: product.media?.[0]?.url,
                    variantSku: selectedVariant.sku,
                    unitPrice: selectedVariant.price,
                    quantity: 1,
                    size: selectedVariant.size,
                    color: selectedVariant.color,
                    maxStock: variantStock ?? selectedVariant.stock,
                  });
                  router.push("/checkout");
                }}
                disabled={!canAddToCart}
                style={{
                  width: "100%", borderRadius: 999, padding: "0.8rem", fontSize: "0.92rem", fontWeight: 700,
                  background: "transparent", color: canAddToCart ? "var(--text)" : "var(--text-muted)",
                  border: "1px solid rgba(255,255,255,0.2)", cursor: canAddToCart ? "pointer" : "not-allowed",
                  transition: "border-color 150ms, background 150ms, opacity 150ms",
                  minHeight: 48, opacity: canAddToCart ? 1 : 0.4,
                }}
              >
                {product.status === "preorder" ? "Pre-order & pay" : "Buy now"}
              </button>
            )}
          </div>

          {/* Back-in-stock signup when selected variant is OOS */}
          {selectedVariant && variantStock === 0 && (
            <BackInStockForm productId={product.id} variantSku={selectedVariant.sku} />
          )}

          {/* Delivery info strip */}
          <div style={{
            display: "flex", gap: "1rem", flexWrap: "wrap",
            padding: "0.85rem 1rem", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {[
              { icon: "🚚", text: "Free shipping ₹1,500+" },
              { icon: "↩️", text: "Easy returns" },
              { icon: "🔒", text: "Secure checkout" },
            ].map(({ icon, text }) => (
              <span key={text} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <span aria-hidden="true">{icon}</span> {text}
              </span>
            ))}
          </div>

          <Link href="/products" style={{
            display: "inline-flex", alignItems: "center",
            color: "var(--text-muted)", fontSize: "0.83rem",
            textDecoration: "none", gap: 5,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to all products
          </Link>
        </div>
      </div>

      <ReviewsSection slug={product.slug} productId={product.id} />
      <RelatedProducts slug={product.slug} />

      {sizeGuideOpen && (
        <SizeGuideModal
          category={product.category}
          onClose={() => setSizeGuideOpen(false)}
        />
      )}

      {/* Sticky ATC bar — slides in when the main ATC scrolls off-screen */}
          <div className={`sticky-atc${stickyVisible ? " visible" : ""}`} aria-hidden={!stickyVisible}>
        <div className="sticky-atc-info">
          <div className="sticky-atc-title">{product.title}</div>
          <div className="sticky-atc-price">
            {comingSoon
              ? "Coming soon"
              : selectedVariant
                ? `₹${selectedVariant.price.toLocaleString("en-IN")}`
                : displayPrice !== null
                  ? `from ₹${displayPrice.toLocaleString("en-IN")}`
                  : "Price unavailable"}
          </div>
        </div>
        <button
          className="sticky-atc-btn"
          disabled={!canAddToCart}
          onClick={() => {
            if (!selectedVariant) return;
            addItem({
              productId: product.id,
              productTitle: product.title,
              productSlug: product.slug,
              imageUrl: product.media?.[0]?.url,
              variantSku: selectedVariant.sku,
              unitPrice: selectedVariant.price,
              quantity: 1,
              size: selectedVariant.size,
              color: selectedVariant.color,
              maxStock: variantStock ?? selectedVariant.stock,
            });
            setAdded(true);
            if (addedTimer.current) clearTimeout(addedTimer.current);
            addedTimer.current = setTimeout(() => setAdded(false), 2200);
          }}
        >
          {comingSoon ? "Coming soon" : added ? "✓ Added!" : !selectedSize || !selectedColor ? "Select options" : variantStock === 0 ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

// ─── Related products ────────────────────────────────────────────────────────
function RelatedProducts({ slug }: { slug: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: Product[] }>(`/api/v1/products/${slug}/related`)
      .then((r) => setProducts(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (!loading && products.length === 0) return null;

  return (
    <section style={{ padding: "2.5rem 0 1rem" }}>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
        You may also like
      </h2>
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-image" />
              <div className="skeleton-body">
                <div className="skeleton skeleton-line-sm" />
                <div className="skeleton skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
