"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@asur/utils";
import { useCartStore } from "../../store/cart-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());

  // Avoid hydration mismatch from localStorage rehydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const shipping = subtotal > 0 ? (subtotal >= 150000 ? 0 : 25000) : 0;
  const total = subtotal + shipping;

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
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
          <circle cx="28" cy="28" r="27" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <path d="M18 20h2l3 14h14l2-10H22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="26" cy="37" r="1.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="34" cy="37" r="1.5" fill="rgba(255,255,255,0.3)" />
        </svg>
        <h2 style={{ margin: 0 }}>Your cart is empty</h2>
        <p>Find something you love and add it here.</p>
        <Link
          href="/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            padding: "0.85rem 1.5rem",
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            color: "#130f0b",
            fontWeight: 700,
            fontSize: "0.92rem",
            textDecoration: "none",
          }}
        >
          Browse products
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
              {/* Thumbnail placeholder */}
              <div className="cart-thumb" />

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
          {shipping > 0 && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Free shipping on orders above {formatCurrency(150000)}
            </p>
          )}
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
