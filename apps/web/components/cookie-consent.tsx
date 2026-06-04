"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "asur_cookie_prefs";

type CookiePrefs = {
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
};

function loadPrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePrefs;
  } catch {
    return null;
  }
}

function savePrefs(prefs: CookiePrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export function useCookiePrefs(): CookiePrefs {
  return {
    analytics: loadPrefs()?.analytics ?? false,
    marketing: loadPrefs()?.marketing ?? false,
    decided: loadPrefs()?.decided ?? false
  };
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    // Only show if user hasn't decided yet
    const prefs = loadPrefs();
    if (!prefs?.decided) {
      // Delay slightly so it doesn't flash on initial render
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function acceptAll() {
    savePrefs({ analytics: true, marketing: true, decided: true });
    setVisible(false);
  }

  function rejectAll() {
    savePrefs({ analytics: false, marketing: false, decided: true });
    setVisible(false);
  }

  function saveManaged() {
    savePrefs({ analytics, marketing, decided: true });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-modal="false"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9000,
        padding: "0 0.75rem 0.75rem",
        pointerEvents: "none"
      }}
    >
      <div style={{
        maxWidth: 520,
        margin: "0 auto",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(18,14,10,0.96)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
        padding: "1.25rem",
        pointerEvents: "auto"
      }}>
        {!managing ? (
          <>
            <p style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.92rem" }}>🍪 Cookie preferences</p>
            <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              We use essential cookies to run this site, and optional cookies for analytics and marketing with your consent.{" "}
              <Link href="/privacy#cookies" style={{ color: "#f97316", textDecoration: "none" }}>Learn more</Link>
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={acceptAll}
                style={{
                  flex: "1 1 120px", padding: "0.65rem 1rem", borderRadius: 999,
                  background: "linear-gradient(135deg, #f97316, #fb7185)",
                  border: "none", color: "#130f0b", fontWeight: 700, fontSize: "0.85rem",
                  cursor: "pointer", minHeight: 40
                }}
              >
                Accept all
              </button>
              <button
                onClick={rejectAll}
                style={{
                  flex: "1 1 120px", padding: "0.65rem 1rem", borderRadius: 999,
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--text)", fontWeight: 600, fontSize: "0.85rem",
                  cursor: "pointer", minHeight: 40
                }}
              >
                Reject non-essential
              </button>
              <button
                onClick={() => setManaging(true)}
                style={{
                  flex: "1 1 auto", padding: "0.65rem 1rem", borderRadius: 999,
                  background: "transparent", border: "none",
                  color: "var(--text-muted)", fontWeight: 500, fontSize: "0.82rem",
                  cursor: "pointer", textDecoration: "underline", minHeight: 40
                }}
              >
                Manage preferences
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 1rem", fontWeight: 700, fontSize: "0.92rem" }}>Manage cookie preferences</p>

            {/* Essential — always on */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p style={{ margin: "0 0 0.15rem", fontWeight: 600, fontSize: "0.85rem" }}>Essential</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Authentication, cart, security — always required</p>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--success, #22c55e)", fontWeight: 600 }}>Always on</span>
            </div>

            {/* Analytics */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p style={{ margin: "0 0 0.15rem", fontWeight: 600, fontSize: "0.85rem" }}>Analytics</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Help us understand how visitors use the site</p>
              </div>
              <button
                role="switch"
                aria-checked={analytics}
                onClick={() => setAnalytics((v) => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 999, border: "none",
                  background: analytics ? "#f97316" : "rgba(255,255,255,0.12)",
                  cursor: "pointer", position: "relative", transition: "background 0.2s",
                  flexShrink: 0
                }}
                aria-label="Toggle analytics cookies"
              >
                <span style={{
                  position: "absolute", top: 3, left: analytics ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#fff", transition: "left 0.2s"
                }} />
              </button>
            </div>

            {/* Marketing */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", marginBottom: "1rem" }}>
              <div>
                <p style={{ margin: "0 0 0.15rem", fontWeight: 600, fontSize: "0.85rem" }}>Marketing</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Personalised ads and retargeting</p>
              </div>
              <button
                role="switch"
                aria-checked={marketing}
                onClick={() => setMarketing((v) => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 999, border: "none",
                  background: marketing ? "#f97316" : "rgba(255,255,255,0.12)",
                  cursor: "pointer", position: "relative", transition: "background 0.2s",
                  flexShrink: 0
                }}
                aria-label="Toggle marketing cookies"
              >
                <span style={{
                  position: "absolute", top: 3, left: marketing ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#fff", transition: "left 0.2s"
                }} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={saveManaged}
                style={{
                  flex: 1, padding: "0.65rem 1rem", borderRadius: 999,
                  background: "linear-gradient(135deg, #f97316, #fb7185)",
                  border: "none", color: "#130f0b", fontWeight: 700, fontSize: "0.85rem",
                  cursor: "pointer", minHeight: 40
                }}
              >
                Save preferences
              </button>
              <button
                onClick={() => setManaging(false)}
                style={{
                  padding: "0.65rem 1rem", borderRadius: 999,
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--text-muted)", fontWeight: 500, fontSize: "0.82rem",
                  cursor: "pointer", minHeight: 40
                }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
