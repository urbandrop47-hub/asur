import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribed",
  robots: { index: false }
};

export default function UnsubscribedPage() {
  return (
    <div style={{ maxWidth: 480, margin: "6rem auto", padding: "2rem 1.25rem", textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", margin: "0 auto 1.5rem",
        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem"
      }}>✓</div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>You're unsubscribed</h1>
      <p style={{ margin: "0 0 2rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
        You've been removed from our marketing emails. You'll still receive transactional emails about your orders, returns, and account security.
      </p>
      <p style={{ margin: "0 0 2rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        Changed your mind? Go to{" "}
        <Link href="/account/notifications" style={{ color: "#f97316", textDecoration: "none" }}>
          Account → Notifications
        </Link>{" "}
        to re-subscribe.
      </p>
      <Link
        href="/products"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          padding: "0.85rem 2rem", borderRadius: 999,
          background: "linear-gradient(135deg, #f97316, #fb7185)",
          color: "#130f0b", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem"
        }}
      >
        Continue shopping
      </Link>
    </div>
  );
}
