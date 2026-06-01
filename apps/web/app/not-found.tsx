import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found — ASUR",
  description: "This page doesn't exist. Browse the full ASUR collection.",
};

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "2rem",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: "clamp(5rem, 20vw, 10rem)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          background: "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(251,113,133,0.15))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          userSelect: "none",
        }}
      >
        404
      </div>

      <div>
        <h1
          style={{
            margin: "0 0 0.5rem",
            fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
            fontWeight: 800,
            color: "var(--text)",
          }}
        >
          Neither here. Nor there.
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: 400 }}>
          This page wandered off. The drop you're looking for may have ended or the URL may be wrong.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/products"
          style={{
            padding: "0.65rem 1.4rem",
            borderRadius: 999,
            background: "linear-gradient(135deg, #f97316, #fb7185)",
            color: "#130f0b",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
        >
          Browse the collection
        </Link>
        <Link
          href="/"
          style={{
            padding: "0.65rem 1.4rem",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--text-muted)",
            fontWeight: 600,
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
