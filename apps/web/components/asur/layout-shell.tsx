'use client';

import type { CartItem } from '@/lib/asur-catalog';
import { NAV_CATEGORIES, NAV_ACCOUNT } from '@/lib/asur-catalog';
import { HeroArt } from './patterns';
import { Icon } from './icons';

// ── Desktop Sidebar ───────────────────────────────────────────────────
interface SideBarProps {
  activeCat: string;
  onCat: (cat: string) => void;
}

export function SideBar({ activeCat, onCat }: SideBarProps) {
  return (
    <aside className="side">
      <div className="side-logo">ASUR<sup>IN</sup></div>
      <div className="side-tag">Neither divine · Nor damned</div>
      <nav className="side-nav">
        {NAV_CATEGORIES.map((c) => (
          <a href="#grid" key={c.label}
             className={activeCat === c.label ? 'on' : ''}
             onClick={(e) => { e.preventDefault(); onCat(c.label); }}>
            <span>{c.label}</span>
            <Icon name="chevron" className="ar" />
          </a>
        ))}
      </nav>
      <div className="side-account">
        {NAV_ACCOUNT.map((a) => (
          <a href="#" key={a.label} className={a.full ? 'full' : ''}>{a.label}</a>
        ))}
      </div>
      <div className="side-foot">
        <span className="deva">असुर</span>
        <span className="mono">© 2026 · MUMBAI · IN</span>
      </div>
    </aside>
  );
}

// ── Compact Top Bar (tablet + mobile) ────────────────────────────────
interface TopBarCompactProps {
  cartCount: number;
  onMenu: () => void;
  onCart: () => void;
}

export function TopBarCompact({ cartCount, onMenu, onCart }: TopBarCompactProps) {
  return (
    <header className="web-topbar">
      <button className="web-burger" aria-label="Menu" onClick={onMenu}>
        <span /><span /><span />
      </button>
      <div className="web-topbar-logo">ASUR<sup>IN</sup></div>
      <div className="web-topbar-right">
        <button className="web-ic" aria-label="Search"><Icon name="search" /></button>
        <button className="web-ic" aria-label="Cart" onClick={onCart}>
          <Icon name="bag" />
          {cartCount > 0 && <span className="ct">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}

// ── Desktop Utility Bar ───────────────────────────────────────────────
interface UtilBarProps {
  cartCount: number;
  onCart: () => void;
}

export function UtilBar({ cartCount, onCart }: UtilBarProps) {
  return (
    <div className="web-util">
      <div className="web-search">
        <Icon name="search" />
        <input placeholder="SEARCH THE DROP — रावण, GOLD TIER, BACK-PRINT…" aria-label="Search" />
      </div>
      <div className="web-util-right">
        <a href="#" className="web-util-link">THE LORE</a>
        <a href="#" className="web-util-link">TRACK ORDER</a>
        <button className="web-ic" aria-label="Wishlist"><Icon name="heart" /></button>
        <button className="web-ic" aria-label="Account">
          <Icon name="user" />
        </button>
        <button className="web-ic" aria-label="Cart" onClick={onCart}>
          <Icon name="bag" />
          {cartCount > 0 && <span className="ct">{cartCount}</span>}
        </button>
      </div>
    </div>
  );
}

// ── Desktop Landscape Hero ────────────────────────────────────────────
export function WebHero() {
  return (
    <section className="web-hero" id="top">
      <div className="web-hero-card">
        <div className="web-hero-art">
          <HeroArt />
          <div className="web-hero-deva" aria-hidden="true">असुर</div>
        </div>
        <div className="web-hero-body">
          <span className="web-hero-kicker">FOUNDING DROP · LIVE NOW</span>
          <h1 className="web-hero-title">NEITHER<br />DIVINE.<br /><em>NOR DAMNED.</em></h1>
          <p className="web-hero-sub">
            Eight pieces. No restock. The asuras were never the evil ones — they were
            the friction the universe needed. Claim the Founding Three before the plates are destroyed.
          </p>
          <div className="web-hero-actions">
            <a href="#grid" className="web-cta">ENTER THE DROP <Icon name="arrow" /></a>
            <a href="#" className="web-cta ghost">READ THE LORE</a>
          </div>
        </div>
      </div>
    </section>
  );
}
