import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subscription Confirmed" };

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const invalid = params.status === "invalid";

  return (
    <div style={{ maxWidth: 480, margin: "6rem auto", padding: "0 1rem", textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, margin: "0 auto 1.5rem",
        background: invalid ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg, #f97316, #fb7185)",
        boxShadow: invalid ? "none" : "0 8px 28px rgba(249,115,22,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.6rem",
      }}>
        {invalid ? "⚠" : "✓"}
      </div>

      {invalid ? (
        <>
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 800 }}>Link expired</h1>
          <p style={{ margin: "0 0 2rem", fontSize: "0.9rem", color: "rgba(246,241,234,0.55)", lineHeight: 1.65 }}>
            This confirmation link has expired or was already used. Subscribe again from the footer to get a fresh link.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 800 }}>You&apos;re in!</h1>
          <p style={{ margin: "0 0 2rem", fontSize: "0.9rem", color: "rgba(246,241,234,0.55)", lineHeight: 1.65 }}>
            Welcome to the ASUR list. You&apos;ll be first to know about drops, restocks, and exclusive offers.
          </p>
        </>
      )}

      <Link
        href="/"
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #f97316, #fb7185)",
          color: "#130f0b", fontWeight: 700, fontSize: "0.92rem",
          textDecoration: "none", padding: "0.85rem 1.75rem", borderRadius: 999,
        }}
      >
        Browse the drop
      </Link>
    </div>
  );
}
