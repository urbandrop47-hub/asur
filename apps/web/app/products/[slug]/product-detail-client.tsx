"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product, Review } from "@asur/types";
import { formatCurrency } from "@asur/utils";
import { ProductImageGallery } from "../../../components/product-image-gallery";
import { useCartStore } from "../../../store/cart-store";
import { useAuthStore } from "../../../store/auth-store";
import { track } from "../../../lib/analytics";
import { api } from "../../../lib/api";
import { StarRating, InteractiveStars } from "../../../components/star-rating";
import { HeartButton } from "../../../components/heart-button";
import { ProductCard } from "../../../components/product-card";
import { recordView } from "../../../lib/recently-viewed";

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

  useEffect(() => {
    api.get<{ data: { reviews: Review[]; aggregate: ReviewAggregate } }>(`/api/v1/products/${slug}/reviews`)
      .then((r) => { setReviews(r.data.reviews); setAggregate(r.data.aggregate); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    if (body.length < 10) { setError("Review must be at least 10 characters"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/v1/reviews", { productId, orderId, rating, body });
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <StarRating rating={review.rating} size={14} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.65, color: "var(--text)" }}>{review.body}</p>
            </div>
          ))}
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
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    track("product_viewed", { id: product.id, slug: product.slug, title: product.title });
    recordView(product);
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, [product.id, product.slug, product.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];

  const selectedVariant =
    selectedSize && selectedColor
      ? product.variants.find((v) => v.size === selectedSize && v.color === selectedColor)
      : null;

  const variantStock = selectedVariant ? selectedVariant.stock : null;
  const displayPrice = selectedVariant
    ? selectedVariant.price
    : Math.min(...product.variants.map((v) => v.price));
  const comparePrice =
    selectedVariant?.compareAtPrice ??
    (product.variants.every((v) => v.compareAtPrice)
      ? Math.min(...product.variants.map((v) => v.compareAtPrice!))
      : undefined);

  const stockInfo = variantStock !== null ? stockLabel(variantStock) : null;
  const canAddToCart = !!selectedVariant && variantStock !== 0;

  function isComboAvailable(size: string, color: string) {
    return product.variants.some((v) => v.size === size && v.color === color && v.stock > 0);
  }

  const pickerBtn = (selected: boolean, available: boolean): React.CSSProperties => ({
    minWidth: 52, minHeight: 44, padding: "0.45rem 0.9rem", borderRadius: 10,
    border: selected ? "2px solid var(--accent)" : "1px solid rgba(255,255,255,0.14)",
    background: selected ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.04)",
    color: available ? "var(--text)" : "rgba(246,241,234,0.25)",
    fontWeight: selected ? 700 : 500, fontSize: "0.88rem",
    cursor: available ? "pointer" : "not-allowed",
    textDecoration: available ? "none" : "line-through",
    transition: "border-color 150ms ease, background 150ms ease, transform 100ms ease",
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
          <ProductImageGallery media={product.media} title={product.title} />
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

          {/* Price + stock */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span className="pdp-price">
                {product.variants.length > 1 && !selectedVariant ? "from " : ""}
                {formatCurrency(displayPrice)}
              </span>
              {comparePrice && comparePrice > displayPrice && (
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
          </div>

          <hr className="pdp-divider" />

          {/* Size picker */}
          {sizes.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Size
                {selectedSize
                  ? <span style={{ color: "var(--text)", marginLeft: "0.4rem" }}>— {selectedSize}</span>
                  : <span style={{ color: "rgba(246,241,234,0.35)", marginLeft: "0.4rem", fontWeight: 400 }}>— select one</span>}
              </p>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {sizes.map((size) => {
                  const available = selectedColor
                    ? isComboAvailable(size, selectedColor)
                    : product.variants.some((v) => v.size === size && v.stock > 0);
                  const selected = selectedSize === size;
                  return (
                    <button key={size} onClick={() => setSelectedSize(selected ? null : size)} disabled={!available} style={pickerBtn(selected, available)}>
                      {size}
                    </button>
                  );
                })}
              </div>
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
                    : product.variants.some((v) => v.color === color && v.stock > 0);
                  const selected = selectedColor === color;
                  return (
                    <button key={color} onClick={() => setSelectedColor(selected ? null : color)} disabled={!available} style={pickerBtn(selected, available)}>
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

          {/* Add to cart + Wishlist */}
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "stretch" }}>
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
                maxStock: selectedVariant.stock,
              });
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
                  : "Add to cart"}
          </button>
          <HeartButton product={product} size={20} />
          </div>

          {added && (
            <Link href="/cart" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--accent)", fontSize: "0.88rem", fontWeight: 600,
              textDecoration: "none", gap: 6,
              animation: "fadeInUp 0.3s ease both",
            }}>
              View cart
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}

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
