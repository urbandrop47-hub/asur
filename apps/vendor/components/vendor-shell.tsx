"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearVendorToken, readVendorToken, saveVendorToken } from "../lib/auth-storage";

function LoginScreen({ onSave }: { onSave: () => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (token.trim().length < 4) { setError("Token too short"); return; }
    saveVendorToken(token.trim());
    onSave();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 360, border: "1px solid var(--border)", borderRadius: 20, padding: "2rem", background: "rgba(255,255,255,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #22c55e, #f59e0b)", flexShrink: 0, display: "block" }} />
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.92rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>ASUR Vendor</p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>Fulfillment workspace</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}>
              Vendor bearer token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(""); }}
              placeholder="Firebase UID or session token"
              style={{
                width: "100%", padding: "0.75rem", borderRadius: 10,
                border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)",
                color: "var(--text)", fontSize: "0.88rem", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box" as const
              }}
            />
            {error && <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "#ef4444" }}>{error}</p>}
          </div>
          <button
            type="submit"
            style={{
              padding: "0.85rem", borderRadius: 999, fontWeight: 700, fontSize: "0.92rem",
              background: "linear-gradient(135deg, #22c55e, #f59e0b)", color: "#050706",
              border: "none", cursor: "pointer", fontFamily: "inherit"
            }}
          >
            Enter workspace
          </button>
        </form>
      </div>
    </div>
  );
}

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setToken(readVendorToken());
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!token) return <LoginScreen onSave={() => setToken(readVendorToken())} />;

  const isTasksActive = pathname.startsWith("/tasks");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.9rem 1.25rem", borderBottom: "1px solid var(--border)",
        background: "rgba(5,7,6,0.92)", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #22c55e, #f59e0b)", flexShrink: 0, display: "block" }} />
          <span style={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            ASUR Vendor
          </span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link
            href="/tasks"
            style={{
              padding: "0.4rem 0.85rem", borderRadius: 999, fontSize: "0.82rem", fontWeight: 600,
              background: isTasksActive ? "rgba(34,197,94,0.12)" : "transparent",
              color: isTasksActive ? "#22c55e" : "var(--text-muted)",
              border: `1px solid ${isTasksActive ? "rgba(34,197,94,0.25)" : "transparent"}`,
              textDecoration: "none"
            }}
          >
            Tasks
          </Link>
          <button
            onClick={() => { clearVendorToken(); setToken(null); }}
            style={{
              padding: "0.4rem 0.85rem", borderRadius: 999, fontSize: "0.82rem",
              border: "1px solid rgba(239,68,68,0.25)", background: "transparent",
              color: "#ef4444", cursor: "pointer", fontFamily: "inherit"
            }}
          >
            Sign out
          </button>
        </nav>
      </header>
      <main style={{ flex: 1, padding: "1.5rem 1.25rem", maxWidth: 700, width: "100%", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
