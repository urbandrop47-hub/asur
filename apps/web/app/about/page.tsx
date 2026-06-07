import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About ASUR — Neither Divine. Nor Damned.",
  description: "ASUR is Indian streetwear built on a drop model. Limited runs, intentional design, no restocks. This is who we are.",
  alternates: { canonical: "https://weareasur.in/about" },
  openGraph: {
    title: "About ASUR",
    description: "Neither Divine. Nor Damned. Indian streetwear built for those who move in silence.",
    url: "https://weareasur.in/about",
    siteName: "ASUR",
    type: "website",
  },
};

const PILLARS = [
  {
    eyebrow: "The model",
    title: "One run. Gone forever.",
    body: "Every ASUR piece is produced in a single batch. No restocks. No perpetual sale rack. When it's gone, it's gone — and that's intentional. We'd rather make fewer things that matter than flood the market with units that don't.",
  },
  {
    eyebrow: "The material",
    title: "230 GSM combed cotton.",
    body: "We use heavyweight combed cotton, drop-washed before it reaches you to lock in the texture and eliminate shrinkage. The weight has presence. You'll feel the difference the moment you put it on.",
  },
  {
    eyebrow: "The origin",
    title: "Built in India, for India.",
    body: "ASUR started with a single question: why does Indian streetwear apologise for itself? We design for the people who don't. Every collection references something — a sound, a mythology, a moment in culture — that belongs to us.",
  },
  {
    eyebrow: "The name",
    title: "Neither divine nor damned.",
    body: "In mythology, the Asura were cast as the opposition — the unruly, the unconventional, the ones who asked why. We take that as a compliment. This brand is for people who don't fit the assigned category.",
  },
];

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ASUR",
  url: "https://weareasur.in",
  logo: "https://weareasur.in/icon-512.png",
  description: "Premium Indian streetwear built on a drop model. Limited quantities. Single price. No restocks.",
  email: "support@weareasur.in",
  foundingDate: "2024",
  foundingLocation: { "@type": "Place", addressCountry: "IN" },
  sameAs: ["https://instagram.com/wearASUR"],
};

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://weareasur.in" },
    { "@type": "ListItem", position: 2, name: "About", item: "https://weareasur.in/about" },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema).replace(/</g, "\\u003C").replace(/>/g, "\\u003E") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003C").replace(/>/g, "\\u003E") }} />
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.25rem 6rem" }}>

      {/* Hero */}
      <div style={{ marginBottom: "4rem" }}>
        <p style={{ margin: "0 0 1rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--f-mono)" }}>
          About
        </p>
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Neither Divine.<br />
          <span style={{ background: "linear-gradient(135deg, #f97316, #fb7185)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Nor Damned.
          </span>
        </h1>
        <p style={{ margin: 0, fontSize: "clamp(1rem, 2vw, 1.15rem)", color: "rgba(246,241,234,0.6)", lineHeight: 1.8, maxWidth: 580 }}>
          ASUR is Indian streetwear built on a drop model. We make things with intention, produce them once, and ship them to people who get it. That&apos;s the whole thing.
        </p>
      </div>

      {/* Divider line */}
      <div style={{ height: 1, background: "linear-gradient(90deg, rgba(249,115,22,0.4), transparent)", marginBottom: "4rem" }} />

      {/* Pillars */}
      <div style={{ display: "grid", gap: "3.5rem", marginBottom: "4rem" }}>
        {PILLARS.map((p, i) => (
          <div key={p.eyebrow} style={{ display: "grid", gridTemplateColumns: i % 2 === 0 ? "1fr" : "1fr", gap: "0.85rem" }}>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", fontFamily: "var(--f-mono)" }}>
              {p.eyebrow}
            </p>
            <h2 style={{ margin: 0, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {p.title}
            </h2>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "rgba(246,241,234,0.62)", lineHeight: 1.85, maxWidth: 560 }}>
              {p.body}
            </p>
          </div>
        ))}
      </div>

      {/* Manifesto block */}
      <div style={{ padding: "2.5rem", borderRadius: 20, border: "1px solid rgba(249,115,22,0.18)", background: "linear-gradient(135deg, rgba(249,115,22,0.06), rgba(251,113,133,0.04))", marginBottom: "4rem" }}>
        <p style={{ margin: "0 0 1rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", fontFamily: "var(--f-mono)" }}>
          What we believe
        </p>
        <div style={{ display: "grid", gap: "1rem" }}>
          {[
            "Design is not decoration. Every choice in a garment is a decision about what the wearer means to the world.",
            "Scarcity is not a gimmick. It's a commitment. We only make what we're willing to stand behind.",
            "Indian streetwear doesn't need to borrow its identity from anywhere else.",
            "If you found ASUR, you already know why you're here.",
          ].map((line) => (
            <p key={line} style={{ margin: 0, fontSize: "1rem", color: "rgba(246,241,234,0.78)", lineHeight: 1.75, fontStyle: "italic" }}>
              &ldquo;{line}&rdquo;
            </p>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "4rem" }}>
        {[
          { label: "Founded", value: "2024" },
          { label: "Made in", value: "India" },
          { label: "Restocks", value: "Rare" },
          { label: "GSM", value: "230" },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: "1.25rem", border: "1px solid var(--border)", borderRadius: 14, background: "rgba(255,255,255,0.02)" }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.02em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Enough reading. The drop is the point.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/products"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "0.9rem 1.75rem", background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none" }}
          >
            Shop the drop
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/journal"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "0.9rem 1.75rem", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text)", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none" }}
          >
            Read the journal
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
