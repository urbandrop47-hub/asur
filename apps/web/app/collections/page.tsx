import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Collections — ASUR",
  description: "Explore ASUR drop collections — limited runs, each with a story. Void Season, Black Mirror, and more.",
  alternates: {
    canonical: "https://asur.in/collections",
    languages: { "en-IN": "https://asur.in/collections" },
  },
  openGraph: {
    title: "Collections — ASUR",
    description: "Limited-run drop collections from ASUR. New season, new lore.",
    url: "https://asur.in/collections",
    siteName: "ASUR",
    type: "website",
  },
  twitter: { card: "summary", title: "Collections — ASUR" },
};

type Collection = {
  slug: string;
  eyebrow: string;
  title: string;
  lore: string;
  description: string;
  tags: string[];
  status: "live" | "limited" | "core" | "collab";
  featured?: boolean;
  gradient: string;
  accentColor: string;
};

const COLLECTIONS: Collection[] = [
  {
    slug: "void-season",
    eyebrow: "Drop 001 · SS 2025",
    title: "Void Season",
    lore: "For those who move in silence.",
    description: "Minimalist silhouettes built from the space between noise and clarity. Every piece asks the same question — what do you carry when you carry nothing?",
    tags: ["Oversized", "Drop", "Limited"],
    status: "limited",
    featured: true,
    gradient: "radial-gradient(circle at 25% 40%, rgba(212,90,26,0.55) 0%, transparent 55%), radial-gradient(circle at 75% 70%, rgba(56,189,248,0.25) 0%, transparent 50%), linear-gradient(135deg, #0a0a0f 0%, #0d0d14 100%)",
    accentColor: "#f97316",
  },
  {
    slug: "black-mirror",
    eyebrow: "Capsule · AW 2025",
    title: "Black Mirror",
    lore: "High-contrast. Stark. Unignorable.",
    description: "Graphic-heavy, monochrome-forward. Built for the room that goes quiet when you walk in.",
    tags: ["Capsule", "Graphic"],
    status: "live",
    gradient: "radial-gradient(circle at 30% 30%, rgba(139,26,26,0.5) 0%, transparent 50%), linear-gradient(160deg, #0f0a0a 0%, #0a0a0f 100%)",
    accentColor: "#fb7185",
  },
  {
    slug: "dust-collective",
    eyebrow: "Collab · SS 2025",
    title: "Dust Collective",
    lore: "The city and the soil.",
    description: "Earth tones meet urban geometry. A collaboration rooted in what the streets taught us.",
    tags: ["Collab", "Earthtone"],
    status: "collab",
    gradient: "radial-gradient(circle at 60% 40%, rgba(196,146,26,0.4) 0%, transparent 50%), linear-gradient(150deg, #0c0b09 0%, #0a0a0f 100%)",
    accentColor: "#f59e0b",
  },
  {
    slug: "static",
    eyebrow: "Always · Core",
    title: "Static",
    lore: "No noise. Just cuts.",
    description: "The essentials. These exist outside of season — they're the foundation before anything else. No graphics, no hooks, no trend dependency.",
    tags: ["Core", "Essentials", "Year-round"],
    status: "core",
    gradient: "radial-gradient(circle at 40% 50%, rgba(56,189,248,0.2) 0%, transparent 55%), linear-gradient(135deg, #09090f 0%, #0a0f15 100%)",
    accentColor: "#38bdf8",
  },
];

const STATUS_LABEL: Record<Collection["status"], string> = {
  live: "Live now",
  limited: "Limited stock",
  core: "Always available",
  collab: "Collaboration",
};

export default function CollectionsPage() {
  return (
    <div className="stack">
      {/* Hero */}
      <div style={{ paddingBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(249,115,22,0.8)", fontFamily: "var(--f-mono)" }}>
          Drops &amp; Collections
        </p>
        <h1 style={{ margin: "0 0 0.85rem", fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
          Curated<br />
          <span style={{ background: "linear-gradient(135deg, #f97316, #fb7185)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Releases
          </span>
        </h1>
        <p style={{ margin: 0, fontSize: "0.92rem", color: "rgba(246,241,234,0.5)", maxWidth: 480, lineHeight: 1.75 }}>
          Seasonal drops, capsule collections, and limited collaborations. Every run is intentional. Every piece is finite.
        </p>
      </div>

      {/* Collection grid */}
      <div style={{ display: "grid", gap: "1.25rem" }}>
        {COLLECTIONS.map((col) => (
          <Link
            key={col.slug}
            href={`/products?collection=${col.slug}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              className="collection-card-item"
              style={{
                position: "relative",
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                minHeight: col.featured ? 320 : 220,
              }}
            >
              {/* Gradient bg */}
              <div style={{ position: "absolute", inset: 0, background: col.gradient }} />
              {/* Subtle dark overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)" }} />

              {/* Content */}
              <div style={{ position: "relative", padding: col.featured ? "2.25rem 2rem" : "1.75rem 1.75rem", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", minHeight: col.featured ? 320 : 220, boxSizing: "border-box" }}>
                <div>
                  {/* Status + eyebrow row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "3px 9px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      background: `${col.accentColor}18`, color: col.accentColor,
                      border: `1px solid ${col.accentColor}30`,
                    }}>
                      {STATUS_LABEL[col.status]}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(246,241,234,0.4)", fontFamily: "var(--f-mono)" }}>
                      {col.eyebrow}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", fontStyle: "italic", color: `${col.accentColor}cc`, letterSpacing: "0.01em" }}>
                    {col.lore}
                  </p>
                  <h2 style={{ margin: "0 0 0.6rem", fontSize: col.featured ? "clamp(1.6rem, 3vw, 2.2rem)" : "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#f6f1ea" }}>
                    {col.title}
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(246,241,234,0.58)", lineHeight: 1.7, maxWidth: 500 }}>
                    {col.description}
                  </p>
                </div>

                <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {col.tags.map((tag) => (
                      <span key={tag} style={{
                        padding: "3px 9px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 600,
                        background: "rgba(255,255,255,0.07)", color: "rgba(246,241,234,0.5)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 700, color: col.accentColor }}>
                    Shop
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <p style={{
        textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem",
        fontFamily: "var(--f-mono)", letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        New drops every season · Follow{" "}
        <span style={{ color: "var(--accent)" }}>@wearASUR</span>{" "}
        for early access
      </p>
    </div>
  );
}
