import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unsubscribed" };

export default function NewsletterUnsubscribedPage() {
  return (
    <div style={{ maxWidth: 480, margin: "6rem auto", padding: "0 1rem", textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, margin: "0 auto 1.5rem",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.5rem",
      }}>
        ↩
      </div>
      <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 800 }}>Unsubscribed</h1>
      <p style={{ margin: "0 0 2rem", fontSize: "0.9rem", color: "rgba(246,241,234,0.55)", lineHeight: 1.65 }}>
        You&apos;ve been removed from the ASUR newsletter. You won&apos;t receive any more marketing emails.<br /><br />
        Change your mind? Re-subscribe from the footer anytime.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          color: "rgba(246,241,234,0.6)", fontSize: "0.88rem",
          textDecoration: "underline",
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
