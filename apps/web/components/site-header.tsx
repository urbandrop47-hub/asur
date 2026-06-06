"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { APP_NAME } from "@asur/constants";
import { firebaseAuth } from "../lib/firebase";
import { useCartStore } from "../store/cart-store";
import { useAuthStore } from "../store/auth-store";
import { useWishlistStore } from "../store/wishlist-store";
import { useNotificationStore } from "../store/notification-store";
import { NotificationDrawer } from "./notification-drawer";

type SuggestItem = {
  slug: string;
  title: string;
  category: string;
  image?: string;
};

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/collections", label: "Collections" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "Account" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Autocomplete Dropdown ─────────────────────────────────────────────────────

function SuggestDropdown({
  query,
  suggestions,
  loading,
  activeIdx,
  onSelect,
  onSubmit
}: {
  query: string;
  suggestions: SuggestItem[];
  loading: boolean;
  activeIdx: number;
  onSelect: (slug: string) => void;
  onSubmit: () => void;
}) {
  if (!query || query.length < 2) return null;
  const hasResults = suggestions.length > 0;

  return (
    <div
      role="listbox"
      aria-label="Search suggestions"
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        background: "var(--surface, #1a1510)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        zIndex: 200,
        overflow: "hidden",
        maxHeight: 360
      }}
    >
      {loading && (
        <div style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.83rem" }}>
          Searching…
        </div>
      )}

      {!loading && hasResults && suggestions.map((item, i) => (
        <button
          key={item.slug}
          role="option"
          aria-selected={i === activeIdx}
          onClick={() => onSelect(item.slug)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            width: "100%",
            padding: "0.65rem 1rem",
            border: "none",
            background: i === activeIdx ? "rgba(249,115,22,0.08)" : "transparent",
            cursor: "pointer",
            textAlign: "left",
            borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              width={36}
              height={36}
              style={{ borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 6,
              background: "rgba(249,115,22,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              <SearchIcon />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.title}
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {item.category}
            </p>
          </div>
        </button>
      ))}

      {/* "See all results" footer */}
      <button
        onClick={onSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "0.75rem 1rem",
          border: "none",
          borderTop: hasResults ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: activeIdx === suggestions.length ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.04)",
          cursor: "pointer",
          color: "#f97316",
          fontSize: "0.83rem",
          fontWeight: 600
        }}
      >
        <span>See all results for "{query}"</span>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M3 6.5h7M7 3l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {!loading && !hasResults && (
        <div style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.83rem" }}>
          No results for "{query}" — try a different term
        </div>
      )}
    </div>
  );
}

// ── useSearchSuggest hook ─────────────────────────────────────────────────────

function useSearchSuggest(query: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || query.length < 2) {
      setSuggestions([]);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/products/suggest?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.data?.products ?? []);
        }
      } catch {
        // silent — suggestions are best-effort
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, enabled]);

  return { suggestions, loading };
}

// ── SiteHeader ────────────────────────────────────────────────────────────────

export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);   // desktop inline
  const [overlayOpen, setOverlayOpen] = useState(false); // mobile overlay
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const overlayWrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { suggestions, loading } = useSearchSuggest(query, dropdownVisible);

  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);
  const { unreadCount, fetch: fetchNotifications, openDrawer: openNotifDrawer } =
    useNotificationStore();

  useEffect(() => { setMounted(true); }, []);

  // Poll notifications every 60s when signed in and tab is focused
  useEffect(() => {
    if (!session) return;
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications();
    }, 60_000);
    return () => clearInterval(interval);
  }, [session, fetchNotifications]);

  // Shadow on scroll
  useEffect(() => {
    function onScroll() {
      document.querySelector("header.site-header")?.classList.toggle("scrolled", window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = (drawerOpen || overlayOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen, overlayOpen]);

  // Auto-focus on open
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);
  useEffect(() => {
    if (overlayOpen) setTimeout(() => overlayInputRef.current?.focus(), 50);
  }, [overlayOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node) &&
        overlayWrapRef.current && !overlayWrapRef.current.contains(e.target as Node)
      ) {
        setDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setOverlayOpen(false);
        setDropdownVisible(false);
        setQuery("");
        setActiveIdx(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset active index when suggestions change
  useEffect(() => { setActiveIdx(-1); }, [suggestions]);

  function openSearch(type: "desktop" | "mobile") {
    setDropdownVisible(true);
    setQuery("");
    setActiveIdx(-1);
    if (type === "desktop") setSearchOpen(true);
    else setOverlayOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setOverlayOpen(false);
    setDropdownVisible(false);
    setQuery("");
    setActiveIdx(-1);
  }

  function submitSearch(q: string) {
    const trimmed = q.trim();
    closeSearch();
    if (trimmed) router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  function selectSuggestion(slug: string) {
    closeSearch();
    router.push(`/products/${slug}`);
  }

  // Total navigable items: suggestions + 1 (the "See all" footer)
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const total = suggestions.length + 1; // +1 for "see all" row
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        selectSuggestion(suggestions[activeIdx].slug);
      } else {
        submitSearch(query);
      }
    }
  }

  async function handleSignOut() {
    if (firebaseAuth) await signOut(firebaseAuth).catch(() => {});
    clearSession();
    setDrawerOpen(false);
  }

  const dropdownEl = dropdownVisible ? (
    <SuggestDropdown
      query={query}
      suggestions={suggestions}
      loading={loading}
      activeIdx={activeIdx}
      onSelect={selectSuggestion}
      onSubmit={() => submitSearch(query)}
    />
  ) : null;

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark" />
            <span>
              <strong>{APP_NAME}</strong>
              <span>Premium fashion</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="nav-links" aria-label="Primary">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
            <Link href="/wishlist" className="nav-cart-link">
              Wishlist
              {mounted && wishlistCount > 0 && (
                <span key={wishlistCount} className="cart-badge">{wishlistCount > 99 ? "99+" : wishlistCount}</span>
              )}
            </Link>
            <Link href="/cart" className="nav-cart-link">
              Cart
              {mounted && itemCount > 0 && (
                <span key={itemCount} className="cart-badge">{itemCount > 99 ? "99+" : itemCount}</span>
              )}
            </Link>

            {/* Notification bell */}
            {session && mounted && (
              <button
                onClick={openNotifDrawer}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                style={{
                  position: "relative", background: "none", border: "none",
                  cursor: "pointer", color: "var(--text-muted)", display: "flex",
                  alignItems: "center", padding: "0.45rem", borderRadius: 8
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 2a5.5 5.5 0 0 1 5.5 5.5c0 2.5.8 4 2 5H1.5c1.2-1 2-2.5 2-5A5.5 5.5 0 0 1 9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M7 15a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: 2, right: 2,
                    background: "#f97316", color: "#130f0b",
                    fontSize: "0.62rem", fontWeight: 800, lineHeight: 1,
                    minWidth: 16, height: 16, borderRadius: 999,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px"
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Desktop search — inline expand with autocomplete */}
            {searchOpen ? (
              <div ref={searchWrapRef} style={{ position: "relative" }}>
                <div className="search-inline" role="combobox" aria-expanded={dropdownVisible} aria-haspopup="listbox">
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search drops…"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setDropdownVisible(true); }}
                    onFocus={() => setDropdownVisible(true)}
                    onKeyDown={handleKeyDown}
                    aria-label="Search products"
                    aria-autocomplete="list"
                    autoComplete="off"
                  />
                  <button
                    className="search-inline-clear"
                    onClick={closeSearch}
                    aria-label="Close search"
                  >
                    ✕
                  </button>
                </div>
                {dropdownEl}
              </div>
            ) : (
              <button
                className="search-trigger"
                onClick={() => openSearch("desktop")}
                aria-label="Open search"
              >
                <SearchIcon />
                <span>Search</span>
              </button>
            )}

            {session ? (
              <button
                onClick={handleSignOut}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 999,
                  padding: "0.45rem 0.9rem",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.88rem"
                }}
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/auth"
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #f97316, #fb7185)",
                  color: "#130f0b",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textDecoration: "none"
                }}
              >
                Sign in
              </Link>
            )}
          </nav>

          {/* Mobile search + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <button
              className="header-search-btn"
              onClick={() => openSearch("mobile")}
              aria-label="Search"
            >
              <SearchIcon />
            </button>
            <button
              className="hamburger"
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
                <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
                <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen search overlay */}
      <div
        className={`search-overlay${overlayOpen ? " open" : ""}`}
        role="search"
        aria-hidden={!overlayOpen}
      >
        <div ref={overlayWrapRef} style={{ position: "relative" }}>
          <div className="search-overlay-bar">
            <SearchIcon />
            <input
              ref={overlayInputRef}
              className="search-overlay-input"
              type="search"
              placeholder="Search drops, fits, materials…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setDropdownVisible(true); }}
              onFocus={() => setDropdownVisible(true)}
              onKeyDown={handleKeyDown}
              aria-label="Search products"
              aria-autocomplete="list"
              autoComplete="off"
            />
            <button
              className="search-overlay-close"
              onClick={closeSearch}
            >
              Cancel
            </button>
          </div>
          {/* Autocomplete in overlay */}
          {overlayOpen && dropdownEl}
        </div>

        {!query && !dropdownVisible && (
          <div className="search-overlay-hint">
            Try "oversized", "t-shirt", or a collection name
          </div>
        )}
      </div>

      {/* Notification slide-over */}
      <NotificationDrawer />

      {/* Mobile nav overlay */}
      <div
        className={`nav-overlay${drawerOpen ? " open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <nav
        className={`nav-drawer${drawerOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!drawerOpen}
      >
        <div className="nav-drawer-header">
          <span style={{ fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.78rem" }}>
            {APP_NAME}
          </span>
          <button
            className="nav-drawer-close"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            {item.label}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35 }} aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}

        <Link href="/wishlist" className="nav-drawer-link" onClick={() => setDrawerOpen(false)}>
          <span>
            Wishlist
            {mounted && wishlistCount > 0 && (
              <span style={{ marginLeft: "0.5rem", background: "rgba(251,113,133,0.25)", color: "#fb7185", borderRadius: 999, padding: "1px 7px", fontSize: "0.72rem", fontWeight: 700 }}>
                {wishlistCount}
              </span>
            )}
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35 }} aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <Link href="/cart" className="nav-drawer-link" onClick={() => setDrawerOpen(false)}>
          <span>
            Cart
            {mounted && itemCount > 0 && (
              <span style={{ marginLeft: "0.5rem", background: "var(--accent)", color: "#130f0b", borderRadius: 999, padding: "1px 7px", fontSize: "0.72rem", fontWeight: 700 }}>
                {itemCount}
              </span>
            )}
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35 }} aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {session && (
          <button
            className="nav-drawer-link"
            onClick={() => { setDrawerOpen(false); openNotifDrawer(); }}
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span>
              Notifications
              {mounted && unreadCount > 0 && (
                <span style={{ marginLeft: "0.5rem", background: "#f97316", color: "#130f0b", borderRadius: 999, padding: "1px 7px", fontSize: "0.72rem", fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35 }} aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
          {session ? (
            <>
              <p style={{ margin: "0 0 0.75rem", color: "var(--text-muted)", fontSize: "0.83rem" }}>
                {session.user.email ?? session.user.name ?? "Signed in"}
              </p>
              <button
                onClick={handleSignOut}
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "0.85rem", color: "var(--text)", cursor: "pointer", fontSize: "0.92rem" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              onClick={() => setDrawerOpen(false)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b", borderRadius: 12, padding: "0.9rem", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
