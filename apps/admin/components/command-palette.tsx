"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Command = {
  id: string;
  label: string;
  icon: string;
  group: string;
  href?: string;
  action?: () => void;
  keywords?: string;
};

const COMMANDS: Command[] = [
  // Navigate
  { id: "goto-dashboard", label: "Dashboard", icon: "⬡", group: "Go to", href: "/" },
  { id: "goto-orders", label: "Orders", icon: "◫", group: "Go to", href: "/orders" },
  { id: "goto-products", label: "Products", icon: "◈", group: "Go to", href: "/products" },
  { id: "goto-inventory", label: "Inventory", icon: "⊞", group: "Go to", href: "/inventory" },
  { id: "goto-reviews", label: "Reviews", icon: "★", group: "Go to", href: "/reviews" },
  { id: "goto-coupons", label: "Coupons", icon: "%", group: "Go to", href: "/coupons" },
  { id: "goto-returns", label: "Returns", icon: "↩", group: "Go to", href: "/returns" },
  { id: "goto-gift-cards", label: "Gift Cards", icon: "🎁", group: "Go to", href: "/gift-cards" },
  { id: "goto-newsletter", label: "Newsletter", icon: "✉", group: "Go to", href: "/newsletter" },
  { id: "goto-articles", label: "Articles", icon: "✍", group: "Go to", href: "/articles" },
  { id: "goto-settings", label: "Settings", icon: "⚙", group: "Go to", href: "/settings" },
  { id: "goto-settings-audit", label: "Audit Log", icon: "📋", group: "Go to", href: "/settings/audit-log", keywords: "audit log history" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? COMMANDS.filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q) || (c.keywords ?? "").toLowerCase().includes(q);
      })
    : COMMANDS;

  // Group by group label
  const groups = filtered.reduce<Record<string, Command[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c);
    return acc;
  }, {});

  const flat = filtered; // flat list for keyboard navigation

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { setCursor(0); }, [query]);

  const execute = useCallback((cmd: Command) => {
    onClose();
    if (cmd.href) router.push(cmd.href);
    else cmd.action?.();
  }, [onClose, router]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((i) => Math.min(i + 1, flat.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") {
        const cmd = flat[cursor];
        if (cmd) execute(cmd);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flat, cursor, execute, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  let globalIdx = -1;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(580px, 92vw)",
          background: "var(--palette-bg, #0d1321)",
          border: "1px solid var(--palette-border, rgba(255,255,255,0.13))",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
          maxHeight: "60vh",
        }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1.1rem", borderBottom: "1px solid var(--palette-border, rgba(255,255,255,0.08))" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ opacity: 0.4, flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: "0.95rem", color: "var(--text)", fontFamily: "inherit",
            }}
            aria-label="Command search"
            autoComplete="off"
          />
          <kbd style={{ fontSize: "0.68rem", padding: "2px 6px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-muted)", flexShrink: 0, fontFamily: "inherit" }}>esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1, padding: "0.4rem 0" }} role="listbox">
          {filtered.length === 0 ? (
            <p style={{ padding: "1rem 1.1rem", fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>No commands found.</p>
          ) : (
            Object.entries(groups).map(([group, cmds]) => (
              <div key={group}>
                <p style={{ margin: 0, padding: "0.5rem 1.1rem 0.25rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", opacity: 0.7 }}>
                  {group}
                </p>
                {cmds.map((cmd) => {
                  globalIdx++;
                  const idx = globalIdx;
                  const active = idx === cursor;
                  return (
                    <button
                      key={cmd.id}
                      data-idx={idx}
                      role="option"
                      aria-selected={active}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setCursor(idx)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        width: "100%", padding: "0.6rem 1.1rem",
                        background: active ? "rgba(56,189,248,0.1)" : "transparent",
                        border: "none", cursor: "pointer", textAlign: "left",
                        color: active ? "var(--accent)" : "var(--text)",
                        fontFamily: "inherit", fontSize: "0.88rem",
                        transition: "background 80ms",
                      }}
                    >
                      <span style={{ fontSize: "1rem", width: 20, textAlign: "center", flexShrink: 0, opacity: active ? 1 : 0.65 }}>{cmd.icon}</span>
                      <span style={{ fontWeight: active ? 600 : 400 }}>{cmd.label}</span>
                      {active && (
                        <kbd style={{ marginLeft: "auto", fontSize: "0.68rem", padding: "2px 6px", borderRadius: 5, border: "1px solid rgba(56,189,248,0.3)", color: "var(--accent)", fontFamily: "inherit", flexShrink: 0 }}>↵</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: "0.5rem 1.1rem", borderTop: "1px solid var(--palette-border, rgba(255,255,255,0.06))", display: "flex", gap: "1.25rem" }}>
          {[["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]].map(([key, label]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.68rem", color: "var(--text-muted)" }}>
              <kbd style={{ padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", fontFamily: "inherit" }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
