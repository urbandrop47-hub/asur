"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@asur/utils";
import { useCartStore } from "../../store/cart-store";
import { useSiteConfigStore } from "../../store/site-config-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());
  const { config, fetch: fetchConfig } = useSiteConfigStore();

  // Avoid hydration mismatch from localStorage rehydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); fetchConfig(); }, [fetchConfig]);

  const { freeShippingThreshold, shippingFee, gstRate } = config;
  const shipping = subtotal > 0 ? (subtotal >= freeShippingThreshold ? 0 : shippingFee) : 0;
  const tax = subtotal > 0 ? Math.round(subtotal * gstRate) : 0;
  const total = subtotal + shipping + tax;

  if (!mounted) {
    return (
      <div className="stack" style={{ paddingTop: "2rem" }}>
        <div className="skeleton skeleton-line" style={{ height: 36, width: "40%" }} />
        <div className="skeleton skeleton-line" style={{ height: 120, borderRadius: 20 }} />
        <div className="skeleton skeleton-line" style={{ height: 120, borderRadius: 20 }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: "4rem" }}>
        {/* Animated empty cart illustration */}
        <div style={{ position: "relative", width: 96, height: 96, marginBottom: "0.5rem" }}>
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
            <circle cx="48" cy="48" r="46" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
            <circle cx="48" cy="48" r="46" stroke="url(#cartGrad)" strokeWidth="2" strokeDasharray="289" strokeDashoffset="220" strokeLinecap="round" />
            <path d="M30 34h4l6 26h24l4-18H36" stroke="rgba(255,255,255,0.25)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="42" cy="64" r="3" fill="rgba(255,255,255,0.2)" />
            <circle cx="58" cy="64" r="3" fill="rgba(255,255,255,0.2)" />
            <defs>
              <linearGradient id="cartGrad" x1="2" y1="48" x2="94" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f97316" stopOpacity="0.6" />
                <stop offset="1" stopColor="#fb7185" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Your cart is empty</h2>
        <p style={{ maxWidth: 300 }}>Find something you love and add it here. Limited stock — don&apos;t sleep on the drop.</p>
        <Link
          href="/products"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            borderRadius: 999, padding: "0.9rem 1.75rem",
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            color: "#130f0b", fontWeight: 700, fontSize: "0.95rem",
            textDecoration: "none", boxShadow: "0 6px 24px rgba(249,115,22,0.3)",
          }}
        >
          Shop the drop
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7h10M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="stack" style={{ paddingBottom: "8rem" }}>
        <div className="section-title">
          <div>
            <h1>Cart</h1>
            <p style={{ margin: "0.3rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={clear}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 999,
              padding: "0.45rem 0.9rem",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.82rem",
            }}
          >
            Clear all
          </button>
        </div>

        {/* Line items */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 20,
            background: "rgba(255,255,255,0.03)",
            overflow: "hidden",
          }}
        >
          {items.map((item) => (
            <div key={item.variantSku} className="cart-row">
              {/* Thumbnail */}
              <div className="cart-thumb" style={{ position: "relative", overflow: "hidden", flexShrink: 0 }}>
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productTitle}
                    fill
                    sizes="72px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.05)" }} />
                )}
              </div>

              {/* Info */}
              <div className="cart-info">
                <Link
                  href={`/products/${item.productSlug}`}
                  style={{ fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", color: "var(--text)", display: "block", marginBottom: "0.2rem" }}
                >
                  {item.productTitle}
                </Link>
                <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  {item.size} · {item.color}
                </p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>
                  {formatCurrency(item.unitPrice)}
                  {item.quantity > 1 && (
                    <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.8rem", marginLeft: 4 }}>
                      × {item.quantity} = {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  )}
                </p>
              </div>

              {/* Quantity + remove */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
                <div className="cart-qty-controls">
                  <button
                    className="qty-btn"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.variantSku, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600, fontSize: "0.95rem" }}>
                    {item.quantity}
                  </span>
                  <button
                    className="qty-btn"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(item.variantSku, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.variantSku)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(246,241,234,0.35)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary — visible on desktop */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 20,
            background: "rgba(255,255,255,0.03)",
            padding: "1.25rem",
            display: "grid",
            gap: "0.65rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Order summary
          </h3>

          {/* Free shipping progress bar */}
          {shipping > 0 && (
            <div style={{ padding: "0.75rem 0.9rem", borderRadius: 12, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--success)", fontWeight: 600 }}>
                  🚚 Add {formatCurrency(freeShippingThreshold - subtotal)} more for free shipping
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{Math.round((subtotal / freeShippingThreshold) * 100)}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  width: `${Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%`,
                  background: "linear-gradient(90deg, #22c55e, #4ade80)",
                  transition: "width 500ms cubic-bezier(0.22,1,0.36,1)"
                }} />
              </div>
            </div>
          )}
          {shipping === 0 && (
            <div style={{ padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", fontSize: "0.8rem", color: "var(--success)", fontWeight: 600 }}>
              ✓ You qualify for free shipping!
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Shipping</span>
            <span style={{ color: shipping === 0 ? "var(--success)" : "var(--text)" }}>
              {shipping === 0 ? "Free" : formatCurrency(shipping)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--text-muted)" }}>GST (18%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.25rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem" }}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {/* Desktop checkout CTA */}
          <Link
            href="/checkout"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: "0.5rem",
              borderRadius: 999,
              padding: "0.9rem 1.5rem",
              background: "linear-gradient(135deg, #f97316, #fb7185)",
              color: "#130f0b",
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
              minHeight: 48,
            }}
          >
            Proceed to checkout
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link
            href="/products"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              textDecoration: "none",
              gap: 6,
            }}
          >
            Continue shopping
          </Link>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="cart-sticky-bar">
        <div className="subtotal">
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Total</p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem" }}>{formatCurrency(total)}</p>
        </div>
        <Link
          href="/checkout"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            padding: "0.85rem 1.4rem",
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            color: "#130f0b",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            whiteSpace: "nowrap",
            minHeight: 48,
          }}
        >
          Checkout
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </>
  );
}
