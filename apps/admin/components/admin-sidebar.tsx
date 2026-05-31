"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@asur/constants";
import { clearAdminToken, readAdminToken, saveAdminToken } from "../lib/auth-storage";

const NAV = [
  { href: "/", label: "Dashboard", icon: "⬡" },
  { href: "/products", label: "Products", icon: "◈" },
  { href: "/orders", label: "Orders", icon: "◫" }
];

function LoginScreen({ onSave }: { onSave: () => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (token.trim().length < 4) { setError("Token too short"); return; }
    saveAdminToken(token.trim());
    onSave();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 380, border: "1px solid var(--border)", borderRadius: 20, padding: "2rem", background: "rgba(255,255,255,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <span className="brand-mark" style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              ASUR Admin
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{APP_NAME} operations</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}>
              Admin bearer token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(""); }}
              placeholder="Firebase UID or bootstrap token"
              style={{
                width: "100%", padding: "0.75rem", borderRadius: 10,
                border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)",
                color: "var(--text)", fontSize: "0.88rem", outline: "none",
                fontFamily: "inherit"
              }}
            />
            {error && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--danger)" }}>{error}</p>}
          </div>
          <button
            type="submit"
            style={{
              padding: "0.85rem", borderRadius: 999, fontWeight: 700, fontSize: "0.92rem",
              background: "linear-gradient(135deg, #38bdf8, #8b5cf6)", color: "#0b1020",
              border: "none", cursor: "pointer"
            }}
          >
            Enter admin panel
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
          Dev mode: use your Firebase UID or SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID
        </p>
      </div>
    </div>
  );
}

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setToken(readAdminToken());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!token) {
    return <LoginScreen onSave={() => setToken(readAdminToken())} />;
  }

  function handleSignOut() {
    clearAdminToken();
    setToken(null);
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebar = (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark" />
        <div>
          <p className="brand-name">ASUR Admin</p>
          <p className="brand-sub">{APP_NAME}</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link${isActive(item.href) ? " active" : ""}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleSignOut} className="sidebar-signout">
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Sidebar — desktop always visible, mobile via mobileOpen */}
      <div className={`sidebar-wrapper${mobileOpen ? " open" : ""}`}>
        {sidebar}
      </div>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
