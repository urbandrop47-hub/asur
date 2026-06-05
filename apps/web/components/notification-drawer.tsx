"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useNotificationStore, type Notification } from "../store/notification-store";
import { useAuthStore } from "../store/auth-store";

const TYPE_ICON: Record<Notification["type"], string> = {
  order_update: "📦",
  back_in_stock: "🔔",
  drop_launch: "🔥",
  promo: "🏷️",
  loyalty: "⭐"
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationItem({ n }: { n: Notification }) {
  const markRead = useNotificationStore((s) => s.markRead);
  const closeDrawer = useNotificationStore((s) => s.closeDrawer);

  function handleClick() {
    if (!n.read) markRead(n._id);
    closeDrawer();
  }

  const content = (
    <div
      onClick={n.link ? undefined : handleClick}
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        padding: "0.875rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: n.read ? "transparent" : "rgba(249,115,22,0.05)",
        cursor: n.link ? "default" : "pointer",
        transition: "background 0.15s"
      }}
    >
      <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: 2 }}>
        {TYPE_ICON[n.type]}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: n.read ? 500 : 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {n.title}
          </p>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>
            {timeAgo(n.createdAt)}
          </span>
        </div>
        <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
          {n.body}
        </p>
      </div>
      {!n.read && (
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: "#f97316",
          flexShrink: 0, marginTop: 6
        }} />
      )}
    </div>
  );

  if (n.link) {
    return (
      <Link href={n.link} onClick={handleClick} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }
  return content;
}

export function NotificationDrawer() {
  const { drawerOpen, notifications, unreadCount, loading, closeDrawer, markAllRead } =
    useNotificationStore();
  const session = useAuthStore((s) => s.session);

  // Close on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawerOpen, closeDrawer]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (!session) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 400, opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.25s"
        }}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        aria-hidden={!drawerOpen}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)",
          background: "var(--surface, #1a1510)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 401, display: "flex", flexDirection: "column",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)"
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span style={{
                background: "#f97316", color: "#130f0b", borderRadius: 999,
                fontSize: "0.7rem", fontWeight: 800, padding: "2px 7px", lineHeight: 1
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none", border: "none", color: "#f97316",
                  fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: "0.25rem 0.5rem",
                  borderRadius: 6
                }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={closeDrawer}
              aria-label="Close notifications"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", display: "flex", padding: 4, borderRadius: 6
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && notifications.length === 0 ? (
            <div style={{ padding: "2rem 1.25rem", color: "var(--text-muted)", textAlign: "center", fontSize: "0.875rem" }}>
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "3rem 1.25rem", textAlign: "center" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 0.75rem" }}>🔔</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                No notifications yet
              </p>
            </div>
          ) : (
            notifications.map((n) => <NotificationItem key={n._id} n={n} />)
          )}
        </div>
      </aside>
    </>
  );
}
