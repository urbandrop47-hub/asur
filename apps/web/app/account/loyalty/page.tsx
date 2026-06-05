"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../../store/auth-store";
import { api } from "../../../lib/api";

type LoyaltyTier = "Bronze" | "Silver" | "Gold";

type LoyaltyAccount = {
  points: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
};

type LoyaltyTransaction = {
  _id: string;
  type: "earn" | "redeem" | "restore" | "expire" | "referral_bonus";
  points: number;
  description: string;
  createdAt: string;
};

type LoyaltyData = {
  account: LoyaltyAccount;
  transactions: LoyaltyTransaction[];
  earnRate: number;
  redeemRate: number;
  minRedeem: number;
};

const TIER_CONFIG: Record<LoyaltyTier, { color: string; next: number | null; label: string }> = {
  Bronze: { color: "#cd7f32", next: 500, label: "Bronze" },
  Silver: { color: "#c0c0c0", next: 2000, label: "Silver" },
  Gold: { color: "#f97316", next: null, label: "Gold" }
};

const TX_ICON: Record<LoyaltyTransaction["type"], string> = {
  earn: "💰",
  redeem: "🎁",
  restore: "↩",
  expire: "⏳",
  referral_bonus: "👥"
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function LoyaltyPage() {
  const router = useRouter();
  const { session, hydrated } = useAuthStore();
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) { router.replace("/auth?next=/account/loyalty"); return; }
    api
      .get<{ data: LoyaltyData }>("/api/v1/loyalty/")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, hydrated, router]);

  if (!hydrated || !session) return null;

  const tier = data?.account.tier ?? "Bronze";
  const tierCfg = TIER_CONFIG[tier];
  const lifetimePts = data?.account.lifetimePoints ?? 0;
  const progressPct = tierCfg.next
    ? Math.min(100, Math.round((lifetimePts / tierCfg.next) * 100))
    : 100;

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "2rem 1rem 4rem", display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/account" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>← Account</Link>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Loyalty Points</h1>
      </div>

      {loading ? (
        <>
          <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        </>
      ) : !data ? (
        <p style={{ color: "var(--text-muted)" }}>Could not load your loyalty data. Please refresh.</p>
      ) : (
        <>
          {/* Balance card */}
          <div style={{
            background: `linear-gradient(135deg, ${tierCfg.color}22, rgba(249,115,22,0.08))`,
            border: `1px solid ${tierCfg.color}44`,
            borderRadius: 20, padding: "1.5rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Available Points
                </p>
                <p style={{ margin: 0, fontSize: "2.5rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
                  {data.account.points.toLocaleString()}
                </p>
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  ≈ ₹{Math.floor(data.account.points / data.redeemRate)} off your next order
                </p>
              </div>
              <div style={{
                background: `${tierCfg.color}22`, border: `1px solid ${tierCfg.color}55`,
                borderRadius: 10, padding: "0.4rem 0.8rem", textAlign: "center"
              }}>
                <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: tierCfg.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {tierCfg.label}
                </p>
              </div>
            </div>

            {/* Tier progress */}
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {lifetimePts.toLocaleString()} lifetime pts
                </span>
                {tierCfg.next && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {tierCfg.next.toLocaleString()} for next tier
                  </span>
                )}
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: tierCfg.color, borderRadius: 99, transition: "width 0.4s" }} />
              </div>
              {tier === "Gold" && (
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.75rem", color: tierCfg.color, fontWeight: 600 }}>
                  ⭐ Top tier — you've made it!
                </p>
              )}
            </div>
          </div>

          {/* How it works */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
            <p style={{ margin: "0 0 0.9rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              How it works
            </p>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {[
                { icon: "💰", text: `Earn 1 point for every ₹${data.earnRate} you spend` },
                { icon: "🎁", text: `Redeem ${data.redeemRate} points for ₹1 off at checkout` },
                { icon: "👥", text: "Earn 100pts when a friend orders using your referral code" },
                { icon: "🏆", text: "Reach Silver (500pts) and Gold (2000pts) for exclusive perks" }
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{icon}</span>
                  <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                History
              </p>
            </div>
            {data.transactions.length === 0 ? (
              <div style={{ padding: "2rem 1.25rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No transactions yet — start shopping to earn points!
              </div>
            ) : (
              data.transactions.map((tx) => (
                <div key={tx._id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{TX_ICON[tx.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.description}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{timeAgo(tx.createdAt)}</p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: tx.points > 0 ? "#4ade80" : "#fb7185", flexShrink: 0 }}>
                    {tx.points > 0 ? "+" : ""}{tx.points}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
