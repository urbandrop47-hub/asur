"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { APP_NAME } from "@asur/constants";
import { firebaseAuth } from "../lib/firebase";
import { useCartStore } from "../store/cart-store";
import { useAuthStore } from "../store/auth-store";
import { useWishlistStore } from "../store/wishlist-store";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/collections", label: "Collections" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "Account" },
];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);  // desktop inline
  const [overlayOpen, setOverlayOpen] = useState(false); // mobile overlay
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add shadow when scrolled
  useEffect(() => {
    function onScroll() {
      document.querySelector("header.site-header")?.classList.toggle("scrolled", window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (drawerOpen || overlayOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen, overlayOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (overlayOpen) {
      setTimeout(() => overlayInputRef.current?.focus(), 50);
    }
  }, [overlayOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setOverlayOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function submitSearch(q: string) {
    const trimmed = q.trim();
    setSearchOpen(false);
    setOverlayOpen(false);
    setQuery("");
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    }
  }

  async function handleSignOut() {
    if (firebaseAuth) {
      await signOut(firebaseAuth).catch(() => {});
    }
    clearSession();
    setDrawerOpen(false);
  }

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
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/wishlist" className="nav-cart-link">
              Wishlist
              {mounted && wishlistCount > 0 && (
                <span className="cart-badge">{wishlistCount > 99 ? "99+" : wishlistCount}</span>
              )}
            </Link>
            <Link href="/cart" className="nav-cart-link">
              Cart
              {mounted && itemCount > 0 && (
                <span className="cart-badge">{itemCount > 99 ? "99+" : itemCount}</span>
              )}
            </Link>

            {/* Desktop search — inline expand */}
            {searchOpen ? (
              <div className="search-inline" role="search">
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search drops…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSearch(query)}
                  aria-label="Search products"
                />
                <button
                  className="search-inline-clear"
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  aria-label="Close search"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="search-trigger"
                onClick={() => setSearchOpen(true)}
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
                  fontSize: "0.88rem",
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
                  textDecoration: "none",
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
              onClick={() => setOverlayOpen(true)}
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
        <div className="search-overlay-bar">
          <SearchIcon />
          <input
            ref={overlayInputRef}
            className="search-overlay-input"
            type="search"
            placeholder="Search drops, fits, materials…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch(query)}
            aria-label="Search products"
          />
          <button
            className="search-overlay-close"
            onClick={() => { setOverlayOpen(false); setQuery(""); }}
          >
            Cancel
          </button>
        </div>
        {!query && (
          <div className="search-overlay-hint">
            Try "oversized", "t-shirt", or a collection name
          </div>
        )}
        {query && (
          <div className="search-overlay-hint" style={{ cursor: "pointer" }} onClick={() => submitSearch(query)}>
            Press Enter to search for "{query}"
          </div>
        )}
      </div>

      {/* Mobile overlay */}
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

        <Link
          href="/wishlist"
          className="nav-drawer-link"
          onClick={() => setDrawerOpen(false)}
        >
          <span>
            Wishlist
            {mounted && wishlistCount > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  background: "rgba(251,113,133,0.25)",
                  color: "#fb7185",
                  borderRadius: 999,
                  padding: "1px 7px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                {wishlistCount}
              </span>
            )}
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35 }} aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <Link
          href="/cart"
          className="nav-drawer-link"
          onClick={() => setDrawerOpen(false)}
        >
          <span>
            Cart
            {mounted && itemCount > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  background: "var(--accent)",
                  color: "#130f0b",
                  borderRadius: 999,
                  padding: "1px 7px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                {itemCount}
              </span>
            )}
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35 }} aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
          {session ? (
            <>
              <p style={{ margin: "0 0 0.75rem", color: "var(--text-muted)", fontSize: "0.83rem" }}>
                {session.user.email ?? session.user.name ?? "Signed in"}
              </p>
              <button
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: "0.85rem",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: "0.92rem",
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              onClick={() => setDrawerOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                background: "linear-gradient(135deg, #f97316, #fb7185)",
                color: "#130f0b",
                borderRadius: 12,
                padding: "0.9rem",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.95rem",
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
