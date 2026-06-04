"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@asur/types";
import { ProductCard } from "../components/product-card";
import { api } from "../lib/api";
import { getRecent } from "../lib/recently-viewed";

// ─── Marquee strip ────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  "NEW DROP", "LIMITED STOCK", "FREE SHIPPING ₹1500+", "STREETWEAR REDEFINED",
  "PREMIUM FABRICS", "NO RESTOCK", "MADE FOR THE CULTURE", "ASUR ◆"
];

function MarqueeStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]; // doubled for seamless loop
  return (
    <div style={{
      overflow: "hidden",
      background: "rgba(249,115,22,0.08)",
      borderTop: "1px solid rgba(249,115,22,0.15)",
      borderBottom: "1px solid rgba(249,115,22,0.15)",
      padding: "0.6rem 0",
      marginBottom: "0.5rem"
    }} aria-hidden="true">
      <div style={{
        display: "flex",
        gap: "2.5rem",
        animation: "marquee 28s linear infinite",
        width: "max-content",
        willChange: "transform"
      }}>
        {items.map((item, i) => (
          <span key={i} style={{
            fontFamily: "var(--f-mono)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--accent)",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(3.5rem, 10vw, 7rem) 0 clamp(2.5rem, 6vw, 5rem)" }}>
      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} aria-hidden="true">
        <div style={{
          position: "absolute", width: "55vw", height: "55vw", maxWidth: 640, maxHeight: 640,
          top: "-20%", left: "-10%",
          background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
          animation: "drift 22s ease-in-out infinite"
        }} />
        <div style={{
          position: "absolute", width: "40vw", height: "40vw", maxWidth: 480, maxHeight: 480,
          top: "10%", right: "-8%",
          background: "radial-gradient(circle, rgba(251,113,133,0.12) 0%, transparent 70%)",
          animation: "drift 18s ease-in-out infinite reverse 3s"
        }} />
        <div style={{
          position: "absolute", width: "30vw", height: "30vw", maxWidth: 360, maxHeight: 360,
          bottom: "0%", left: "30%",
          background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)",
          animation: "drift 26s ease-in-out infinite 8s"
        }} />
      </div>

      {/* Content */}
      <div className="hero" style={{ position: "relative", zIndex: 1 }}>
        <span className="hero-eyebrow">
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", animation: "pulse-ring 2s ease-in-out infinite" }} />
          New drop — limited quantities
        </span>

        <h1 style={{ margin: 0, fontSize: "clamp(3rem, 9vw, 6.5rem)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", textAlign: "center" }}>
          Neither<br />
          <span style={{
            background: "linear-gradient(135deg, #f97316 0%, #fb7185 50%, #f97316 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "shimmer-text 4s linear infinite"
          }}>
            Divine.
          </span>
          <br />Nor Damned.
        </h1>

        <p style={{ margin: 0, maxWidth: 480, color: "var(--text-muted)", fontSize: "clamp(1rem, 2.2vw, 1.15rem)", lineHeight: 1.75, textAlign: "center" }}>
          Premium Indian streetwear built for the culture. Limited drops. Single price. No restocks. No apology.
        </p>

        <div className="hero-actions">
          <Link
            href="/products"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              borderRadius: 999, padding: "1rem 2rem",
              background: "linear-gradient(135deg, #f97316, #fb7185)",
              color: "#130f0b", fontWeight: 800, fontSize: "0.95rem",
              textDecoration: "none", minHeight: 52,
              boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
              transition: "transform 160ms ease, box-shadow 160ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(249,115,22,0.45)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(249,115,22,0.35)"; }}
          >
            Shop the drop
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/collections"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              borderRadius: 999, padding: "1rem 1.8rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.16)",
              color: "var(--text)", fontWeight: 600, fontSize: "0.95rem",
              textDecoration: "none", minHeight: 52,
              backdropFilter: "blur(8px)",
              transition: "background 160ms ease, border-color 160ms ease",
            }}
          >
            View collections
          </Link>
        </div>

        {/* Social proof */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <span style={{ color: "#fbbf24", letterSpacing: 2 }}>★★★★★</span>
            <span>Rated 4.9 / 5 by early members</span>
          </div>
          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} aria-hidden="true" />
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text)" }}>500+</strong> orders shipped
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Product Skeleton ─────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line-sm" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: "75%" }} />
        <div className="skeleton skeleton-line" style={{ height: 44, borderRadius: 999, marginTop: 4 }} />
      </div>
    </div>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "The Void Season drop is something else. Oversized fit, premium fabric, ships fast. I've bought from plenty of Indian streetwear brands — ASUR is on a different level.",
    author: "Aryan M.",
    location: "Mumbai",
    rating: 5,
    initials: "AM"
  },
  {
    quote: "Ordered the Black Mirror tee at midnight, had it in two days. The 230 GSM fabric is insane for the price. Sizing is true to guide. Already recommended it to my whole crew.",
    author: "Priya K.",
    location: "Bangalore",
    rating: 5,
    initials: "PK"
  },
  {
    quote: "Returns were painless when I needed to exchange sizes. Customer support actually replied in 2 hours. The quality keeps me coming back drop after drop.",
    author: "Rohan S.",
    location: "Delhi",
    rating: 5,
    initials: "RS"
  }
];

function Testimonials() {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ margin: "0 0 0.4rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--f-mono)" }}>
          Social proof
        </p>
        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>What the culture says</h2>
      </div>
      <div className="grid-3" style={{ gap: "0.85rem" }}>
        {TESTIMONIALS.map((t) => (
          <div
            key={t.author}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "1.4rem 1.25rem",
              background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              display: "flex", flexDirection: "column", gap: "1rem"
            }}
          >
            {/* Stars */}
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: t.rating }).map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#fbbf24" aria-hidden="true">
                  <path d="M7 1l1.75 3.6L13 5.24l-3 2.95.7 4.1L7 10.4l-3.7 1.9.7-4.1L1 5.24l4.25-.64L7 1z" />
                </svg>
              ))}
            </div>
            {/* Quote */}
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(246,241,234,0.75)", flex: 1 }}>
              "{t.quote}"
            </p>
            {/* Author */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #f97316, #fb7185)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.72rem", color: "#130f0b", letterSpacing: "0.05em"
              }}>
                {t.initials}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem" }}>{t.author}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Value props ──────────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M3 8h16M7 3l-4 5 4 5M19 8h-5M7 14l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Free shipping",
    body: "On orders above ₹1,500. Pan-India delivery in 5–7 business days."
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 6V4a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="11" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
    title: "Secure payments",
    body: "Powered by Razorpay. Cards, UPI, net banking, and wallets accepted."
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 11l4 4 10-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Premium quality",
    body: "230 GSM combed cotton. Pre-shrunk. Colour-fast. Drop-washed finish."
  }
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSlugs, setRecentSlugs] = useState<{ slug: string; title: string; image?: string }[]>([]);

  useEffect(() => {
    api
      .get<{ data: Product[] }>("/api/v1/products")
      .then((res) => setProducts(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
    setRecentSlugs(getRecent().slice(0, 4));
  }, []);

  const collections = [
    ...new Set(
      products.flatMap((p) => p.collectionSlugs ?? [])
        .filter((s): s is string => typeof s === "string" && s.length > 0)
    )
  ].slice(0, 5);

  return (
    <div>
      {/* Marquee */}
      <MarqueeStrip />

      {/* Hero */}
      <Hero />

      {/* Collection pills */}
      {collections.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
            <Link
              href="/collections"
              style={{
                display: "inline-flex", alignItems: "center", padding: "0.45rem 1rem",
                borderRadius: 999, border: "1px solid rgba(249,115,22,0.35)",
                background: "rgba(249,115,22,0.08)", color: "var(--accent)",
                fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em",
                textDecoration: "none", textTransform: "uppercase", fontFamily: "var(--f-mono)",
                transition: "background 150ms ease",
              }}
            >
              All collections ↗
            </Link>
            {collections.map((slug) => (
              <Link
                key={slug}
                href={`/products?collection=${slug}`}
                style={{
                  display: "inline-flex", alignItems: "center", padding: "0.45rem 1rem",
                  borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)", color: "var(--text-muted)",
                  fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em",
                  textDecoration: "none", textTransform: "uppercase", fontFamily: "var(--f-mono)",
                  transition: "border-color 150ms ease, color 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest drops grid */}
      <section style={{ marginBottom: "3rem" }}>
        <div className="section-title">
          <div>
            <h2>Latest drops</h2>
            <p style={{ margin: "0.3rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Select your size before they&apos;re gone.
            </p>
          </div>
          <Link
            href="/products"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "0.42rem 0.95rem", borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
              color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600,
              letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "var(--f-mono)",
              textDecoration: "none", transition: "color 150ms ease, border-color 150ms ease",
            }}
          >
            All products
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="grid-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map((product, i) => (
                <div key={product.slug} className="animate-in" style={{ animationDelay: `${i * 0.07}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
        </div>

        {!loading && products.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No products available yet — check back soon.
          </div>
        )}
      </section>

      {/* Recently viewed */}
      {recentSlugs.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Recently viewed</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {recentSlugs.map((item) => (
              <Link
                key={item.slug}
                href={`/products/${item.slug}`}
                style={{ textDecoration: "none", color: "var(--text)" }}
              >
                <div style={{
                  border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden",
                  background: "rgba(255,255,255,0.02)",
                  transition: "border-color 180ms",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {item.image ? (
                    <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <div style={{ aspectRatio: "3/4", background: "rgba(255,255,255,0.05)" }} />
                  )}
                  <div style={{ padding: "0.7rem 0.85rem 0.85rem" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <Testimonials />

      {/* Value props */}
      <section style={{ marginBottom: "1rem" }}>
        <div className="grid-3" style={{ gap: "0.85rem" }}>
          {VALUE_PROPS.map((prop) => (
            <div
              key={prop.title}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "1.4rem 1.25rem",
                background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                display: "flex", flexDirection: "column", gap: "0.6rem",
                transition: "border-color 200ms ease, transform 200ms ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(249,115,22,0.25)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = ""; }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--accent)"
              }}>
                {prop.icon}
              </div>
              <strong style={{ display: "block", fontSize: "0.95rem", fontWeight: 700 }}>{prop.title}</strong>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.65 }}>{prop.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
