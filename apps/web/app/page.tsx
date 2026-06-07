"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@asur/types";
import { ProductCard } from "../components/product-card";
import { api } from "../lib/api";
import { getRecent } from "../lib/recently-viewed";

// ─── Marquee strip ────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  "ASUR", "230 GSM combed cotton", "Free shipping ₹1,500+", "Made in India",
  "Limited quantities", "Easy returns", "Water-based print", "ASUR ◆"
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
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(4rem, 11vw, 8rem) 0 clamp(3rem, 7vw, 6rem)" }}>
      {/* Single subtle ambient — one is intentional, three is noise */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(249,115,22,0.09) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="hero" style={{ position: "relative", zIndex: 1 }}>
        <span className="hero-eyebrow">
          New drop — limited quantities
        </span>

        <h1 style={{ margin: 0, fontSize: "clamp(3rem, 9vw, 6.5rem)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", textAlign: "center" }}>
          Neither<br />
          <span style={{ color: "#f97316" }}>Divine.</span>
          <br />Nor Damned.
        </h1>

        <p style={{ margin: 0, maxWidth: 440, color: "var(--text-muted)", fontSize: "clamp(0.95rem, 2vw, 1.1rem)", lineHeight: 1.75, textAlign: "center" }}>
          Premium Indian streetwear. Limited drops. Single price.
        </p>

        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link
            href="/products"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              borderRadius: 999, padding: "1rem 2.25rem",
              background: "#f97316",
              color: "#130f0b", fontWeight: 800, fontSize: "0.95rem",
              textDecoration: "none", minHeight: 52,
              transition: "background 200ms ease, transform 200ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ea6c0a"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.transform = ""; }}
          >
            Shop the drop
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
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

// ─── Journal Preview ─────────────────────────────────────────────────────────

type JournalArticle = {
  _id: string;
  slug: string;
  title: string;
  type: "blog" | "lookbook" | "drop";
  heroImage?: string;
  excerpt?: string;
  publishedAt: string;
};

function JournalPreview() {
  const [articles, setArticles] = useState<JournalArticle[]>([]);

  useEffect(() => {
    void api.get<{ data: JournalArticle[] }>("/api/v1/articles/latest?limit=3")
      .then((r) => setArticles(r.data ?? []))
      .catch(() => {});
  }, []);

  if (articles.length === 0) return null;

  return (
    <section style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Latest from the Journal</h2>
        <Link href="/journal" style={{ fontSize: "0.82rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {articles.map((a) => (
          <Link key={a._id} href={a.type === "drop" ? `/drops/${a.slug}` : `/journal/${a.slug}`} style={{ display: "block", textDecoration: "none" }}>
            <article style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.02)", transition: "border-color 0.2s, transform 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
              <div style={{ position: "relative", aspectRatio: "16/9", background: "rgba(255,255,255,0.04)" }}>
                {a.heroImage
                  ? <Image src={a.heroImage} alt={a.title} fill sizes="320px" style={{ objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(139,92,246,0.1))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "1.5rem", opacity: 0.25 }}>◈</span>
                    </div>
                }
              </div>
              <div style={{ padding: "0.9rem 1rem" }}>
                <p style={{ margin: "0 0 0.3rem", fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--f-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {a.type} · {new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </p>
                <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {a.title}
                </h3>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Brand reel ──────────────────────────────────────────────────────────────

type BrandReelConfig = { url: string; poster?: string; headline?: string };

function BrandReel({ reel }: { reel: BrandReelConfig }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", marginBottom: "3.5rem", borderRadius: 24 }}>
      <div style={{ position: "relative", aspectRatio: "16/7", maxHeight: 520, minHeight: 260, borderRadius: 24, overflow: "hidden" }}>
        <video
          src={reel.url}
          poster={reel.poster}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", display: "block"
          }}
        />
        {/* Dark scrim for headline legibility */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" }} />
        {reel.headline && (
          <div style={{ position: "absolute", bottom: "clamp(1.25rem, 4vw, 2.5rem)", left: "clamp(1.25rem, 4vw, 2.5rem)" }}>
            <p style={{
              margin: 0,
              fontFamily: "var(--f-display)",
              fontSize: "clamp(1.5rem, 4vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#f6f1ea",
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
              lineHeight: 1.1
            }}>
              {reel.headline}
            </p>
          </div>
        )}
      </div>
    </section>
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

// ─── Editorial Grid ───────────────────────────────────────────────────────────

const EDITORIAL_CARDS = [
  {
    slug: "nocturne",
    eyebrow: "New drop",
    title: "NOCTURNE",
    sub: "Limited run. Void-washed streetwear for the after-hours.",
    gradient: "linear-gradient(135deg, rgba(212,90,26,0.55) 0%, rgba(10,10,15,0.7) 60%)",
    tall: true,
  },
  {
    slug: "oversized-essentials",
    eyebrow: "Always stocked",
    title: "ESSENTIALS",
    sub: "12 core pieces. Premium 230 GSM. Never on sale.",
    gradient: "linear-gradient(135deg, rgba(56,189,248,0.35) 0%, rgba(10,10,15,0.75) 60%)",
    tall: false,
  },
];

function EditorialGrid({ collections }: { collections: string[] }) {
  // Use real collection slugs if available, else fall back to static cards
  const cards = collections.length >= 2
    ? collections.slice(0, 2).map((slug, i) => ({
        ...EDITORIAL_CARDS[i % EDITORIAL_CARDS.length],
        slug,
        title: slug.replace(/-/g, " ").toUpperCase(),
        eyebrow: i === 0 ? "New drop" : "Collection",
      }))
    : EDITORIAL_CARDS;

  if (cards.length === 0) return null;

  return (
    <section aria-label="Collections" style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span className="eyebrow eyebrow-fire">Explore collections</span>
        <Link href="/collections" style={{
          fontFamily: "var(--f-mono)", fontSize: "9px", letterSpacing: "0.18em",
          textTransform: "uppercase", color: "var(--bone-q)", textDecoration: "none",
          display: "flex", alignItems: "center", gap: 5,
          transition: "color 150ms ease",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bone-q)")}
        >
          All collections
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
      <div className="editorial-grid">
        {cards.map((card) => (
          <Link
            key={card.slug}
            href={`/products?collection=${card.slug}`}
            className={`editorial-card${card.tall ? " tall" : ""}`}
          >
            {/* Gradient background — real image would go here when available */}
            <div
              className="editorial-card-bg"
              style={{ background: card.gradient + ", var(--card)" }}
            />
            <div className="editorial-card-overlay" />
            <div className="editorial-card-content">
              <div className="editorial-card-eyebrow">{card.eyebrow}</div>
              <h2 className="editorial-card-title">{card.title}</h2>
              <p className="editorial-card-sub">{card.sub}</p>
              <span className="editorial-card-cta">
                Shop now
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                  <path d="M1.5 4.5h6M4.5 1.5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Value strip ──────────────────────────────────────────────────────────────

function ValueStrip() {
  const items = [
    { icon: "🚚", label: "Delivery", value: "Free above ₹1,500" },
    { icon: "♻️", label: "Returns", value: "7-day easy returns" },
    { icon: "🔒", label: "Payments", value: "Razorpay secured" },
    { icon: "🧵", label: "Fabric", value: "230 GSM combed cotton" },
    { icon: "🌍", label: "Shipping", value: "Pan-India delivery" },
  ];
  return (
    <div className="value-strip" role="list" aria-label="Store promises">
      {items.map((item) => (
        <div key={item.label} className="value-strip-item" role="listitem">
          <span className="value-strip-icon" aria-hidden="true">{item.icon}</span>
          <span className="value-strip-label">{item.label}</span>
          <span className="value-strip-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Home strip (New In / Bestsellers) ───────────────────────────────────────

function HomeStrip({ title, href, accentColor, products }: { title: string; href: string; accentColor: string; products: Product[] }) {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <div className="section-title" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          <span style={{ color: accentColor }}>{title}</span>
        </h2>
        <Link
          href={href}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "0.35rem 0.8rem", borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)",
            color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600,
            letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "var(--f-mono)",
            textDecoration: "none",
          }}
        >
          View all
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
      }}>
        {products.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i === 0} />
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSlugs, setRecentSlugs] = useState<{ slug: string; title: string; image?: string }[]>([]);
  const [brandReel, setBrandReel] = useState<BrandReelConfig | null>(null);
  const [newInProducts, setNewInProducts] = useState<Product[]>([]);
  const [bestsellersProducts, setBestsellersProducts] = useState<Product[]>([]);

  useEffect(() => {
    api
      .get<{ data: Product[] }>("/api/v1/products")
      .then((res) => setProducts(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
    setRecentSlugs(getRecent().slice(0, 4));
    // Fetch site config for brand reel
    api
      .get<{ data: { brandReel?: BrandReelConfig } }>("/api/v1/config/public")
      .then((res) => { if (res.data.brandReel) setBrandReel(res.data.brandReel); })
      .catch(() => {});
    // Smart collection strips — non-critical, fail silently
    api.get<{ data: Product[] }>("/api/v1/products/new-in?limit=4")
      .then((res) => setNewInProducts(res.data ?? []))
      .catch(() => {});
    api.get<{ data: Product[] }>("/api/v1/products/bestsellers?limit=4")
      .then((res) => setBestsellersProducts(res.data ?? []))
      .catch(() => {});
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

      {/* Brand reel — shown when admin has set and activated one */}
      {brandReel && <BrandReel reel={brandReel} />}

      {/* Editorial story grid — replaces flat collection pills */}
      <EditorialGrid collections={collections} />

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
                  <ProductCard product={product} priority={i < 2} />
                </div>
              ))}
        </div>

        {!loading && products.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No products available yet — check back soon.
          </div>
        )}
      </section>

      {/* ── New In strip ── */}
      {newInProducts.length > 0 && (
        <HomeStrip title="New In" href="/new-in" accentColor="#818cf8" products={newInProducts} />
      )}

      {/* ── Bestsellers strip ── */}
      {bestsellersProducts.length > 0 && (
        <HomeStrip title="Bestsellers" href="/bestsellers" accentColor="var(--accent)" products={bestsellersProducts} />
      )}

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
                    <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "rgba(255,255,255,0.04)", position: "relative" }}>
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 180px"
                        style={{ objectFit: "cover" }}
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

      {/* Journal preview */}
      <JournalPreview />

      {/* Testimonials */}
      <Testimonials />

      {/* Value props strip */}
      <ValueStrip />
    </div>
  );
}
