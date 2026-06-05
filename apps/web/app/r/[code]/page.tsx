"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params.code === "string" ? params.code.toUpperCase() : "";

  useEffect(() => {
    if (!code) { router.replace("/"); return; }

    // Store the referral code in a 30-day cookie; checkout reads it automatically
    const expires = new Date(Date.now() + 30 * 86400 * 1000).toUTCString();
    document.cookie = `referral_code=${encodeURIComponent(code)}; expires=${expires}; path=/; SameSite=Lax`;

    // Brief pause so the user sees the greeting, then redirect to sign-up
    const timer = setTimeout(() => router.replace("/auth"), 2000);
    return () => clearTimeout(timer);
  }, [code, router]);

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" }}>
      <div>
        <p style={{ fontSize: "3rem", margin: "0 0 1rem" }}>🎁</p>
        <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.8rem", fontWeight: 900 }}>
          You were invited!
        </h1>
        <p style={{ margin: "0 0 1.5rem", color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6 }}>
          Sign up or sign in to claim your{" "}
          <strong style={{ color: "#4ade80" }}>50 bonus loyalty points</strong>.
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
          borderRadius: 12, padding: "0.6rem 1rem"
        }}>
          <code style={{ color: "#f97316", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.1em" }}>
            {code}
          </code>
        </div>
        <p style={{ marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
          Redirecting you to sign in…
        </p>
      </div>
    </div>
  );
}
