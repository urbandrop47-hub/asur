"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@asur/utils";
import { useAuthStore } from "../../../store/auth-store";
import { api } from "../../../lib/api";

type GiftCard = {
  id: string;
  code: string;
  initialAmount: number;
  balance: number;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
};

function formatCode(code: string) {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

function statusBadge(card: GiftCard) {
  if (!card.isActive) return { label: "Deactivated", color: "#fb7185" };
  if (card.expiresAt && new Date(card.expiresAt) < new Date()) return { label: "Expired", color: "#fb7185" };
  if (card.balance === 0) return { label: "Used", color: "var(--text-muted)" };
  return { label: "Active", color: "#4ade80" };
}

function GiftCardItem({ card }: { card: GiftCard }) {
  const status = statusBadge(card);
  const pct = card.initialAmount > 0 ? Math.round((card.balance / card.initialAmount) * 100) : 0;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ margin: 0, fontFamily: "monospace", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.1em", color: "var(--text)" }}>
          {formatCode(card.code)}
        </p>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: status.color, padding: "2px 8px", borderRadius: 99, background: `${status.color}18`, border: `1px solid ${status.color}44` }}>
          {status.label}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: "0 0 0.15rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>Remaining balance</p>
          <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "var(--text)" }}>{formatCurrency(card.balance)}</p>
          <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>of {formatCurrency(card.initialAmount)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          {card.expiresAt && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Expires {new Date(card.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* Balance progress bar */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#f97316,#fb7185)", borderRadius: 99, transition: "width 0.4s" }} />
      </div>

      {card.message && (
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", borderLeft: "2px solid rgba(249,115,22,0.4)", paddingLeft: "0.6rem" }}>
          &ldquo;{card.message}&rdquo;
        </p>
      )}
    </div>
  );
}

export default function GiftCardsPage() {
  const router = useRouter();
  const { session, hydrated } = useAuthStore();
  const [purchased, setPurchased] = useState<GiftCard[]>([]);
  const [received, setReceived] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "purchased">("received");

  useEffect(() => {
    if (!hydrated) return;
    if (!session) { router.replace("/auth?next=/account/gift-cards"); return; }
    api
      .get<{ data: { purchased: GiftCard[]; received: GiftCard[] } }>("/api/v1/gift-cards/")
      .then((r) => {
        setPurchased(r.data.purchased);
        setReceived(r.data.received);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, hydrated, router]);

  if (!hydrated || !session) return null;

  const tabStyle = (active: boolean) => ({
    padding: "0.55rem 1.25rem", borderRadius: 999, fontSize: "0.85rem", fontWeight: 600,
    background: active ? "rgba(249,115,22,0.15)" : "transparent",
    border: active ? "1px solid rgba(249,115,22,0.35)" : "1px solid transparent",
    color: active ? "var(--accent)" : "var(--text-muted)",
    cursor: "pointer"
  });

  const cards = activeTab === "received" ? received : purchased;

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "2rem 1rem 4rem", display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/account" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>← Account</Link>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Gift Cards</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button style={tabStyle(activeTab === "received")} onClick={() => setActiveTab("received")}>
          Received {received.length > 0 ? `(${received.length})` : ""}
        </button>
        <button style={tabStyle(activeTab === "purchased")} onClick={() => setActiveTab("purchased")}>
          Purchased {purchased.length > 0 ? `(${purchased.length})` : ""}
        </button>
      </div>

      {loading ? (
        <>
          <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
        </>
      ) : cards.length === 0 ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 1.5rem", textAlign: "center" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "1.4rem" }}>🎁</p>
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "var(--text)" }}>
            {activeTab === "received" ? "No gift cards received yet" : "You haven't purchased any gift cards"}
          </p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {activeTab === "received"
              ? "Gift cards sent to your email address will appear here."
              : "Send the gift of fashion to someone special."}
          </p>
          {activeTab === "purchased" && (
            <Link
              href="/gift-cards"
              style={{ display: "inline-block", marginTop: "1rem", padding: "0.65rem 1.5rem", borderRadius: 999, background: "linear-gradient(135deg,#f97316,#fb7185)", color: "#130f0b", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}
            >
              Buy a gift card
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {cards.map((card) => <GiftCardItem key={card.id} card={card} />)}
        </div>
      )}

      {/* How to use */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>How to use</p>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {[
            { icon: "🛒", text: "Add items to your cart and proceed to checkout" },
            { icon: "🎁", text: "Enter your gift card code in the Gift Card field at checkout" },
            { icon: "✨", text: "The available balance is applied to your order total" },
            { icon: "💳", text: "Pay the remaining amount with any supported payment method" }
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>{icon}</span>
              <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)" }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
