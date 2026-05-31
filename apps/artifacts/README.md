# Handoff: ASUR — Responsive Storefront (Desktop + Mobile)

## Overview
ASUR is a streetwear storefront (dark "void" theme, brutalist condensed display type,
single fire-orange accent, Devanagari accents). This bundle is the **responsive website**:
a left-sidebar desktop layout that collapses to a mobile app layout, with a working
product listing (PLP), product detail (PDP), cart, filters, and a 3-step checkout.

The entry point is **`ASUR Website.html`**. Open it in any browser — it runs as-is, no
build step. It is a faithful, *running* reference, not a sketch.

---

## About the Design Files
The files in this bundle are **design references implemented in HTML + React (via in-browser
Babel)**. They show the exact intended look and behavior. Your job is to **recreate this UI
inside the target codebase** (e.g. Next.js / Vite + React, with CSS Modules / Tailwind / your
design-system components) using its established patterns — *not* to ship the in-browser-Babel
HTML to production.

That said, the React component tree and the CSS here are already cleanly modular, so in most
React stacks you can port them almost 1:1: move each `.jsx` to a real component file, swap the
`window`-global sharing for ES imports, and move the `<style>`/CSS files into your styling
system. **Match the markup structure and class names and the result is pixel-identical.**

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, interactions, and responsive
behavior. Recreate pixel-for-pixel. All exact values are in `styles.css` (`:root` tokens),
`shop.css` (components), and `web.css` (desktop layout).

---

## ⚠️ READ THIS FIRST — the one trap that breaks fidelity

The original mobile mock (`ASUR Shop.html`, NOT in this bundle) was a **phone-only reference**.
Its `shop.css` contains a block at `@media (min-width: 768px)` that deliberately squeezes the
whole app into a **432px phone-shaped column** centered on desktop, and prints a banner reading
`"ASUR · MOBILE REFERENCE…"`. That is why a naive "build a website from the mock" produced a
useless narrow strip on desktop.

This website **fixes that** in `web.css`, which is loaded *after* `shop.css` and:
1. Neutralises the phone-frame rules: it resets `body`, `#root`, and `body::before` at
   `≥768px` back to normal full-width flow (see the top of `web.css`).
2. Uses a brand-new root class **`.site`** (NOT `.shop`) so none of the phone-frame CSS applies.

**If you port this, do NOT copy the `@media (min-width: 768px)` phone-frame block from
`shop.css`.** It exists only for the mobile mock. Everything you need is the `.site`/`web-*`
layout in `web.css`. (You can keep the rest of `shop.css` — card/drawer/PDP/checkout component
styles — verbatim.)

---

## Architecture / File Map

Load order matters (each `.jsx` publishes its components onto `window` for the next to use).
In a real codebase, replace `window` globals with normal imports.

| File | Role |
|---|---|
| `ASUR Website.html` | Entry point. Loads fonts, React/Babel CDN, the 3 CSS files, then the JSX modules in order. |
| `styles.css` | **Design tokens** (`:root`): palette, type, scale. Base/reset. Display & mono type helpers. |
| `shop.css` | Component styles shared with mobile: product card (`.pcard`), drawers (`.drw`), filter sheet (`.fsheet`), PDP (`.pdp-*`), checkout (`.co-*`), footer (`.s-foot`). **Skip its `@media (min-width:768px)` phone-frame block.** |
| `web.css` | **Desktop website layout** — sidebar, utility bar, hero, toolbar, responsive grid, breakpoints, desktop overlay tweaks. This is the new layer. |
| `tweaks-panel.jsx` | Dev-only "Tweaks" panel (accent color, demo cart). **Omit in production** — it's a preview affordance, not part of the product. |
| `patterns.jsx` | The placeholder art system (woodblock SVG fields, t-shirt silhouette, stamp boxes). These are **slots for real product photography** — replace with `<img>` in production. |
| `shop-data.jsx` | All catalogue + nav + footer data. Replace with your API/CMS. |
| `shop-cards.jsx` | `Icon` (SVG icon set), `RatingPill`, `ProductCard`, `MiniCard`. |
| `shop-filters.jsx` | `applyFilters`/`countActive` (pure helpers), `PriceRange`, `FilterSheet`. |
| `shop-drawers.jsx` | `NavDrawer` (left), `CartDrawer` (right). |
| `shop-pdp.jsx` | `ProductDetail` full-screen product page. |
| `shop-checkout.jsx` | `Checkout` (address → payment → confirmation). |
| `shop-footer.jsx` | `ShopFooter` (newsletter, social, accordions, legal, watermark). |
| `web-app.jsx` | **The desktop shell** — `SideBar`, `TopBarCompact`, `UtilBar`, `WebHero`, and the `WebApp` root that composes everything. This + `web.css` are the only genuinely new files; the rest is shared with the mobile build. |

---

## Design Tokens (from `styles.css :root`)

**Color**
```
--void:   #0A0A0A   /* page background */
--ash:    #18181A   --ash-2: #232326   --ash-3: #2A2A2A   /* elevated surfaces */
--card:   #121214   --card-2:#1A1A1D                      /* (in shop.css) product card bg */
--bone:   #E8E0D0   /* primary text */
--bone-d: #C7BFAF   /* secondary text */
--bone-q: #6A6358   /* muted/quiet text */
--fire:   #D45A1A   /* PRIMARY ACCENT (default) */
--blood:  #8B1A1A   --gold: #C4921A                       /* tier accents */
--accent: var(--fire)   /* the single live accent; tweakable */
--hair:   rgba(232,224,208,0.10)   --hair-2: rgba(232,224,208,0.22)  /* hairline borders */
```

**Type** (Google Fonts: Anton, Archivo, JetBrains Mono, Noto Serif Devanagari)
```
--f-display: "Anton", Impact, sans-serif        /* condensed display, uppercase */
--f-body:    "Archivo", system-ui, sans-serif   /* body */
--f-mono:    "JetBrains Mono", monospace         /* labels, eyebrows, prices-incl-gst */
--f-deva:    "Noto Serif Devanagari", serif      /* Devanagari accents */
```

**Radius / scale** (from `shop.css`): `--r-sm:6px  --r-md:10px  --r-lg:14px`.
Body base font 15px / line-height 1.5.

---

## Layout & Breakpoints (`web.css`)

Root: `.site` → `.site-grid`.

- **≥1024px (desktop):** `.site-grid` is `grid-template-columns: 272px 1fr`.
  - **Left sidebar** `.side` (sticky, full height): logo, tagline, category nav, account
    grid, footer note. Hover states on nav items reveal a chevron.
  - **Main** `.main`: a sticky `.web-util` utility bar (search input + THE LORE / TRACK
    ORDER links + wishlist / account / cart icons), then `.main-inner` (max-width 1180px,
    1320px ≥1380px) holding hero, section head, toolbar, grid; then the footer.
  - Grid `.web-grid`: **3 columns** 1024–1379px, **4 columns** ≥1380px.
  - `.web-topbar` (compact mobile header) is **hidden**.
- **768–1023px (tablet):** sidebar hidden; `.web-topbar` shown (burger · ASUR · search · cart).
  Grid **3 columns**. Landscape hero retained.
- **≤767px (mobile):** `.web-topbar` shown; `.web-util` hidden. Hero stacks to single column
  (art hidden). Grid **2 columns**.

**Critical CSS gotcha (already fixed, keep it):** `.web-util` is `display:none` by default and
only `display:grid` at `≥1024px`. If you forget the default `none`, the desktop search SVG
renders unsized (giant magnifier) on mobile — this was a real bug we hit. Same pattern for
`.web-topbar` (grid by default, `none` at ≥1024px).

---

## Screens / Views

### 1. Product Listing (PLP) — the home view
- **Hero** `.web-hero-card`: 2-col grid (art | copy) on desktop, stacks on mobile. Big
  Devanagari watermark (असुर), woodblock "rays" field, t-shirt silhouette + back stamp on the
  art side; kicker + `NEITHER / DIVINE. / NOR DAMNED.` title (with the third line in accent
  italic) + subcopy + two CTAs (`ENTER THE DROP` solid bone, `READ THE LORE` ghost).
- **Section header** `.web-section-head`: `<h2>` with small Devanagari prefix + active category
  name; right side shows live piece count + `NO RESTOCK`.
- **Toolbar** `.web-toolbar` (sticky): horizontal **quick-filter chips** (`SHOP_CHIPS`), a
  **FILTERS** button (opens the filter drawer, shows active-count badge), and a **SORT** native
  `<select>` (`Featured / Newest Drop / Selling Fast / Price ↑ / Price ↓`).
- **Grid** `.web-grid` of `ProductCard`s. Empty state `.s-empty` ("शून्य / NOTHING MATCHES.").

**ProductCard** (`.pcard`): media (aspect 4/5) with a tier **badge** top-left, **wishlist heart**
top-right, the placeholder art, and an overlaid pills row (rating ★ + stock). Info block: price
(`₹` + `INCL GST`), a **scarcity bar** (`SELLING FAST`/`IN STOCK` + progress + `n/cap`), 2-line
title (Devanagari word + name), and an **ADD TO CART** button that flips to `ADDED ✓` for 1.4s.

### 2. Product Detail (PDP) — `shop-pdp.jsx`
Full-screen overlay (`.pdp`, `position:fixed`). On desktop `web.css` centers it to a 760px
column on a dimmed/blurred backdrop. Sticky top bar (back · name · share), gallery (main + 4
angle thumbs), head (rating/wishlist, big title, subcopy, price + scarcity), **size selector**
(5-up, sold-out sizes struck through), shipping row, lore section (woodblock + Devanagari),
spec grid, reviews, related rail, and a sticky **ADD** bar.

### 3. Cart — `CartDrawer` (right drawer)
Light-headed drawer. Empty state ("YOUR CART IS COLD."), or line items (media · title · qty/size
· price · remove), a "RECENTLY VIEWED" horizontal rail of `MiniCard`s, and a sticky subtotal +
`CHECKOUT` foot.

### 4. Filters — `FilterSheet`
On desktop a **right-side drawer** (`web.css` overrides the mobile bottom-sheet). Groups: TIER
(color-swatch chips), PRICE (dual-thumb range, ₹600–₹1600), FIT (Oversized/Regular segmented),
AVAILABILITY (in-stock toggle). Foot: CLEAR ALL + `SHOW n PIECES`. Filtering logic is the pure
`applyFilters(list, filters)` in `shop-filters.jsx` — reuse it verbatim.

### 5. Navigation — `NavDrawer` (mobile/tablet) + `SideBar` (desktop)
Same data (`NAV_CATEGORIES`, `NAV_ACCOUNT`). Desktop = persistent sidebar; mobile = slide-in
left drawer opened by the burger.

### 6. Checkout — `shop-checkout.jsx`
3 steps with a step bar: **Address** (saved card + add-new form + ETA) → **Payment** (order
summary, payment methods UPI/Card/Netbanking/COD, bill with totals, secure note) →
**Confirmation** (check mark, order id, track CTA). Centered 560px pane.

---

## Interactions & State (`web-app.jsx`)

State in `WebApp`: `navOpen`, `cartOpen`, `filterOpen` (overlay toggles); `cart` (array of
`{...product, qty, size}`); `chip` (active quick-filter); `activeCat` (sidebar selection);
`sortIdx`; `filters` (`{tiers, fits, price:[lo,hi], inStock}`); `view` (`'plp' | 'pdp' |
'checkout'`); `activeProduct`; `showTop`.

- Adding to cart merges by `id+size` and bumps qty; cart count is the qty sum (badge on cart icon).
- Opening PDP/checkout sets `view` and scrolls to top; any open overlay locks `body` scroll.
- Sort re-sorts a copy of the filtered list; quick-filter chips AND with the filter drawer
  (`webChipMatches` + `applyFilters`).
- Back-to-top FAB appears after 700px of scroll.
- Transitions: drawers slide via `transform` `0.34s cubic-bezier(0.22,1,0.36,1)`; filter sheet
  `0.4s` same easing; ADD button state 1.4s.

**Accent color** is driven by the `--accent` CSS variable, set on `:root` from a tweak. In
production just keep `--accent: #D45A1A`; the multi-accent tiers (`--gold`, `--blood`) are used
for badges/swatches.

---

## Assets
**No raster assets are included.** All product imagery is rendered by the placeholder system in
`patterns.jsx` (geometric woodblock SVG + a t-shirt silhouette + a dashed "stamp" box with a
Devanagari label). These are intentionally obvious slots — **replace each with real product
photography** (`<img>` at the same aspect ratios: cards 4/5, hero art 5/6). Icons are inline SVG
in `shop-cards.jsx` (`Icon` component) — keep or swap for your icon library. Fonts load from
Google Fonts (see `<head>`).

---

## Files in this bundle
All listed in the File Map above. `ASUR Website.html` is the runnable entry point; open it to
see the exact target. `web-app.jsx` + `web.css` are the desktop layer; everything else is shared
with the mobile build.
