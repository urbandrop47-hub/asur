import Link from "next/link";

type Collection = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  tags: string[];
  featured?: boolean;
  gradient: string;
  accentColor: string;
};

const COLLECTIONS: Collection[] = [
  {
    slug: "void-season",
    eyebrow: "Drop 001 · SS 2025",
    title: "Void Season",
    description: "From the noise comes clarity. Minimalist silhouettes built for the ones who move in silence.",
    tags: ["Oversized", "Drop", "Limited"],
    featured: true,
    gradient: "radial-gradient(circle at 25% 40%, rgba(212,90,26,0.55) 0%, transparent 55%), radial-gradient(circle at 75% 70%, rgba(56,189,248,0.25) 0%, transparent 50%), linear-gradient(135deg, #0a0a0f 0%, #0d0d14 100%)",
    accentColor: "#f97316",
  },
  {
    slug: "black-mirror",
    eyebrow: "Capsule · AW 2025",
    title: "Black Mirror",
    description: "High-contrast graphics. Stark aesthetics. Every piece demands attention.",
    tags: ["Capsule", "Graphic"],
    gradient: "radial-gradient(circle at 30% 30%, rgba(139,26,26,0.5) 0%, transparent 50%), linear-gradient(160deg, #0f0a0a 0%, #0a0a0f 100%)",
    accentColor: "#fb7185",
  },
  {
    slug: "dust-collective",
    eyebrow: "Collab · SS 2025",
    title: "Dust Collective",
    description: "Earth tones meet urban edge. A collaboration with the streets.",
    tags: ["Collab", "Earthtone"],
    gradient: "radial-gradient(circle at 60% 40%, rgba(196,146,26,0.4) 0%, transparent 50%), linear-gradient(150deg, #0c0b09 0%, #0a0a0f 100%)",
    accentColor: "#f59e0b",
  },
  {
    slug: "static",
    eyebrow: "Always · Core",
    title: "Static",
    description: "The essentials. No noise, no trends — just cuts that last.",
    tags: ["Core", "Essentials", "Year-round"],
    gradient: "radial-gradient(circle at 40% 50%, rgba(56,189,248,0.2) 0%, transparent 55%), linear-gradient(135deg, #09090f 0%, #0a0f15 100%)",
    accentColor: "#38bdf8",
  },
];

export default function CollectionsPage() {
  return (
    <div className="stack">
      {/* Hero */}
      <div className="collections-hero">
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.3rem 0.75rem", borderRadius: 999,
            background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.22)",
            fontFamily: "var(--f-mono)", fontSize: "10px",
            letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent)",
            marginBottom: "0.85rem",
          }}
        >
          <span>●</span> Drops &amp; Collections
        </div>
        <h1>
          Curated<br />
          <span style={{
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Releases
          </span>
        </h1>
        <p className="collections-hero-sub">
          Seasonal drops, capsule collections, and limited collaborations.
          Every run is intentional. Every piece is finite.
        </p>
      </div>

      {/* Collection grid */}
      <div className="collection-grid">
        {COLLECTIONS.map((col) => (
          <Link
            key={col.slug}
            href={`/products?collection=${col.slug}`}
            className={`collection-card${col.featured ? " featured" : ""}`}
          >
            {/* Animated gradient bg */}
            <div
              className="collection-card-bg"
              style={{ background: col.gradient }}
            />
            {/* Dark overlay for text legibility */}
            <div className="collection-card-overlay" />

            {/* Content */}
            <div className="collection-card-body">
              <span className="collection-card-eyebrow" style={{ color: col.accentColor }}>
                {col.eyebrow}
              </span>
              <h2 className="collection-card-title">{col.title}</h2>
              <p className="collection-card-desc">{col.description}</p>

              <div className="collection-card-tags">
                {col.tags.map((tag) => (
                  <span key={tag} className="collection-tag">{tag}</span>
                ))}
              </div>

              <span
                className="collection-cta-btn"
                style={{ color: col.featured ? "var(--void)" : "var(--void)" }}
              >
                Explore
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom note */}
      <p style={{
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.82rem",
        marginTop: "1rem",
        fontFamily: "var(--f-mono)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        New drops every season · Follow{" "}
        <span style={{ color: "var(--accent)" }}>@wearASUR</span>{" "}
        for early access
      </p>
    </div>
  );
}
