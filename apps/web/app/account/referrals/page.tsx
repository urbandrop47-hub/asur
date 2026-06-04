"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../../store/auth-store";
import { api } from "../../../lib/api";

type ReferralData = {
  referralCode: string;
  referralUseCount: number;
};

export default function ReferralsPage() {
  const router = useRouter();
  const { session, hydrated } = useAuthStore();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) { router.replace("/auth?next=/account/referrals"); return; }
    api
      .get<{ data: ReferralData }>("/api/v1/loyalty/")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, hydrated, router]);

  if (!hydrated || !session) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = data ? `${origin}/r/${data.referralCode}` : "";

  async function handleCopy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — select the input
    }
  }

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "2rem 1rem 4rem", display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/account" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>← Account</Link>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Refer a Friend</h1>
      </div>

      {loading ? (
        <>
          <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
        </>
      ) : !data ? (
        <p style={{ color: "var(--text-muted)" }}>Could not load referral data. Please refresh.</p>
      ) : (
        <>
          {/* Referral card */}
          <div style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(251,113,133,0.08))", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 20, padding: "1.5rem", textAlign: "center" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "2rem" }}>👥</p>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 800 }}>Share & earn together</h2>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
              Your friend gets <strong style={{ color: "#4ade80" }}>50 bonus points</strong> on their first order.<br />
              You earn <strong style={{ color: "#f97316" }}>100 points</strong> when they complete it.
            </p>

            <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Your referral code
            </p>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0.65rem 1rem", marginBottom: "1rem" }}>
              <code style={{ flex: 1, fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.12em", color: "#f97316", textAlign: "left" }}>
                {data.referralCode}
              </code>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "rgba(74,222,128,0.15)" : "rgba(249,115,22,0.15)",
                  border: `1px solid ${copied ? "rgba(74,222,128,0.35)" : "rgba(249,115,22,0.35)"}`,
                  borderRadius: 8, padding: "0.4rem 0.75rem", cursor: "pointer",
                  color: copied ? "#4ade80" : "#f97316", fontWeight: 700, fontSize: "0.8rem",
                  transition: "all 0.15s"
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <p style={{ margin: "0 0 0.4rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Or share this link
            </p>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.55rem 0.9rem" }}>
              <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                {referralLink}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "2rem", fontWeight: 900, color: "#f97316" }}>
                {data.referralUseCount}
              </p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Friends referred</p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "2rem", fontWeight: 900, color: "#4ade80" }}>
                {data.referralUseCount * 100}
              </p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Points earned</p>
            </div>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1rem 1.25rem" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>How it works</p>
            {[
              { icon: "1️⃣", text: "Share your code or link with a friend" },
              { icon: "2️⃣", text: "They sign up and place their first order" },
              { icon: "3️⃣", text: "You both earn bonus loyalty points automatically" }
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{icon}</span>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>{text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
