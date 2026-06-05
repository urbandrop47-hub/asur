"use client";

import { useState } from "react";
import { api } from "../lib/api";

type Status = "idle" | "loading" | "success" | "already" | "error";

export function NewsletterSignup({ source = "footer" }: { source?: "footer" | "popup" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setStatus("loading");
    try {
      const res = await api.post<{ success: boolean; alreadySubscribed: boolean }>(
        "/api/v1/newsletter/subscribe",
        { email: trimmed, source }
      );
      setStatus(res.alreadySubscribed ? "already" : "success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{ padding: "0.85rem 1.1rem", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <p style={{ margin: 0, fontSize: "0.84rem", color: "#4ade80", fontWeight: 600 }}>
          Almost there — check your inbox to confirm.
        </p>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div style={{ padding: "0.85rem 1.1rem", borderRadius: 12, background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)" }}>
        <p style={{ margin: 0, fontSize: "0.84rem", color: "#f97316", fontWeight: 600 }}>
          You&apos;re already subscribed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
        placeholder="your@email.com"
        required
        style={{
          flex: "1 1 180px",
          padding: "0.65rem 1rem",
          borderRadius: 999,
          border: status === "error" ? "1px solid var(--danger)" : "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "var(--text)",
          fontSize: "0.88rem",
          outline: "none",
          fontFamily: "inherit",
          minHeight: 42,
        }}
      />
      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        style={{
          padding: "0.65rem 1.25rem",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: "0.85rem",
          background: "linear-gradient(135deg, #f97316, #fb7185)",
          color: "#130f0b",
          border: "none",
          cursor: status === "loading" || !email.trim() ? "not-allowed" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
          flexShrink: 0,
          minHeight: 42,
          transition: "opacity 0.15s",
        }}
      >
        {status === "loading" ? "…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p style={{ width: "100%", margin: 0, fontSize: "0.78rem", color: "var(--danger)" }}>
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}
