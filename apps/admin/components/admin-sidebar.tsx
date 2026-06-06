"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_NAME } from "@asur/constants";
import { clearAdminToken, readAdminToken, saveAdminToken } from "../lib/auth-storage";
import { CommandPalette } from "./command-palette";

const NAV = [
  { href: "/", label: "Dashboard", icon: "⬡" },
  { href: "/products", label: "Products", icon: "◈" },
  { href: "/inventory", label: "Inventory", icon: "⊞" },
  { href: "/orders", label: "Orders", icon: "◫" },
  { href: "/customers", label: "Customers", icon: "⊙" },
  { href: "/reviews", label: "Reviews", icon: "★" },
  { href: "/coupons", label: "Coupons", icon: "%" },
  { href: "/gift-cards", label: "Gift Cards", icon: "🎁" },
  { href: "/returns", label: "Returns", icon: "↩" },
  { href: "/newsletter", label: "Newsletter", icon: "✉" },
  { href: "/articles", label: "Articles", icon: "✍" },
  { href: "/vendors", label: "Vendors", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" }
];

function LoginScreen({ onSave }: { onSave: () => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (token.trim().length < 8) { setError("Password too short"); return; }
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
              Admin password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={token}
                onChange={(e) => { setToken(e.target.value); setError(""); }}
                placeholder="Enter your admin password"
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "0.75rem 2.75rem 0.75rem 0.75rem", borderRadius: 10,
                  border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)",
                  color: "var(--text)", fontSize: "0.88rem", outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{
                  position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
                  fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.35rem", borderRadius: 4
                }}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
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
          Set in <code>ADMIN_SECRET</code> env var on the backend
        </p>
      </div>
    </div>
  );
}

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [gMode, setGMode] = useState(false);

  useEffect(() => {
    setToken(readAdminToken());
    setMounted(true);
    const stored = (typeof localStorage !== "undefined" ? localStorage.getItem("asur-admin-theme") : null) ?? "dark";
    setTheme(stored as "dark" | "light");
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    // Sequence shortcut: g then key
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;
    const seqHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        gPressed = true;
        setGMode(true);
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; setGMode(false); }, 800);
        return;
      }
      if (gPressed) {
        gPressed = false;
        setGMode(false);
        clearTimeout(gTimer);
        if (e.key === "o") { router.push("/orders"); return; }
        if (e.key === "p") { router.push("/products"); return; }
        if (e.key === "d") { router.push("/"); return; }
        if (e.key === "i") { router.push("/inventory"); return; }
      }
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keydown", seqHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keydown", seqHandler);
      clearTimeout(gTimer);
      setGMode(false);
    };
  }, [router]);

  // Body scroll lock when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("asur-admin-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

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
        {gMode && (
          <div style={{ padding: "0.35rem 0.65rem", borderRadius: 7, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.06em" }}>GO TO…</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>O=Orders  P=Products  D=Dashboard  I=Inventory</span>
          </div>
        )}
        <button
          onClick={() => setPaletteOpen(true)}
          className="sidebar-cmd-btn"
          title="Command palette (⌘K)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Search
          <kbd style={{ marginLeft: "auto", fontSize: "0.62rem", padding: "1px 5px", borderRadius: 4, border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "inherit" }}>⌘K</kbd>
        </button>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button onClick={toggleTheme} className="sidebar-theme-btn" title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? "☀" : "◑"}
          </button>
          <button onClick={handleSignOut} className="sidebar-signout" style={{ flex: 1 }}>
            Sign out
          </button>
        </div>
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

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
