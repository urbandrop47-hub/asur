"use client";

import { useEffect, useState } from "react";
import { NewsletterSignup } from "./newsletter-signup";

const STORAGE_KEY = "asur_newsletter_dismissed";

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let triggered = false;

    function onMouseLeave(e: MouseEvent) {
      if (triggered) return;
      if (e.clientY <= 5) {
        triggered = true;
        setVisible(true);
      }
    }

    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe to ASUR"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div style={{
        width: "100%", maxWidth: 440,
        background: "#13121a",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20,
        padding: "2rem",
        position: "relative",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14,
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(246,241,234,0.5)",
            cursor: "pointer", fontSize: "1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{
          width: 44, height: 44, borderRadius: 12, marginBottom: "1.25rem",
          background: "linear-gradient(135deg, #f97316, #fb7185)",
          boxShadow: "0 6px 24px rgba(249,115,22,0.3)",
        }} />

        <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2 }}>
          Before you go —
        </h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", color: "rgba(246,241,234,0.55)", lineHeight: 1.6 }}>
          Get first access to new drops, exclusive offers, and restocks.
          No noise — just the good stuff.
        </p>

        <NewsletterSignup source="popup" />

        <button
          onClick={dismiss}
          style={{
            marginTop: "1rem",
            background: "none", border: "none",
            color: "rgba(246,241,234,0.3)", fontSize: "0.78rem",
            cursor: "pointer", padding: 0, width: "100%", textAlign: "center",
          }}
        >
          No thanks, I&apos;ll miss out
        </button>
      </div>
    </div>
  );
}
