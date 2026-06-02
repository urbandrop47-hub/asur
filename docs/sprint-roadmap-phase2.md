# ASUR — Sprint Roadmap (Sprints 9–23)

**Launch-Ready Feature Backlog**  
Prepared June 2026 · Updated June 2026 · 15 Sprints · 90 Tasks

---

## Contents

1. [Sprint Summary](#sprint-summary)
2. [Execution Order Rationale](#execution-order-rationale)
3. [Sprint 9 — Transactional Email Notifications](#sprint-9--transactional-email-notifications)
4. [Sprint 10 — Search, Filtering & Discovery](#sprint-10--search-filtering--discovery)
5. [Sprint 11 — SEO, Metadata & Structured Data](#sprint-11--seo-metadata--structured-data)
6. [Sprint 12 — Product Reviews & Social Proof](#sprint-12--product-reviews--social-proof)
7. [Sprint 13 — Wishlist & Save for Later](#sprint-13--wishlist--save-for-later)
8. [Sprint 14 — Real-Time Inventory & Stock Management](#sprint-14--real-time-inventory--stock-management)
9. [Sprint 15 — Discount Codes & Promotions](#sprint-15--discount-codes--promotions)
10. [Sprint 16 — Admin Analytics Dashboard](#sprint-16--admin-analytics-dashboard)
11. [Sprint 17 — Production Hardening & Observability](#sprint-17--production-hardening--observability)
12. [Sprint 18 — CI/CD & Railway Deployment](#sprint-18--cicd--railway-deployment)
13. [Sprint 19 — Returns & Refunds](#sprint-19--returns--refunds)
14. [Sprint 20 — Customer Account & Profile](#sprint-20--customer-account--profile)
15. [Sprint 21 — Drop / Flash Sale Engine](#sprint-21--drop--flash-sale-engine)
16. [Sprint 22 — PWA & Performance](#sprint-22--pwa--performance)
17. [Sprint 23 — Abandoned Cart Recovery](#sprint-23--abandoned-cart-recovery)

---

## Sprint Summary

| Sprint | Title | Theme | Duration | Tasks | Status |
|--------|-------|-------|----------|-------|--------|
| S9 | Transactional Email Notifications | Trust | 1 week | 6 | ✅ DONE |
| S10 | Search, Filtering & Discovery | Conversion | 1.5 weeks | 6 | ✅ DONE |
| S11 | SEO, Metadata & Structured Data | Growth | 1 week | 6 | ✅ DONE |
| S12 | Product Reviews & Social Proof | Trust | 1.5 weeks | 6 | ✅ DONE |
| S13 | Wishlist & Save for Later | Retention | 1 week | 6 | ✅ DONE |
| S14 | Real-Time Inventory & Stock Management | Operations | 1 week | 6 | ✅ DONE |
| S15 | Discount Codes & Promotions | Growth | 1.5 weeks | 6 | ✅ DONE |
| S16 | Admin Analytics Dashboard | Operations | 1.5 weeks | 6 | ✅ DONE |
| S17 | Production Hardening & Observability | Reliability | 1 week | 6 | ✅ DONE |
| S18 | CI/CD & Railway Deployment | Reliability | 1 week | 6 | ✅ DONE |
| S19 | Returns & Refunds | Trust | 1.5 weeks | 6 | ✅ DONE |
| S20 | Customer Account & Profile | Retention | 1 week | 6 | TODO ← **next** |
| S21 | Drop / Flash Sale Engine | Growth | 1.5 weeks | 6 | TODO |
| S22 | PWA & Performance | Platform | 1 week | 6 | TODO |
| S23 | Abandoned Cart Recovery | Revenue | 1 week | 6 | TODO |

> **S18 and S19 are hard launch blockers** — the store cannot go live without automated deploys and a refund path. S20–S21 are the next retention and brand-identity layer. S22–S23 are multipliers once the store is live.

---

## Execution Order Rationale

1. **S9 — Email** — trust baseline; without this, paid orders have no paper trail
2. **S10 — Search & Filter** — conversion; customers can't buy what they can't find
3. **S11 — SEO & Metadata** — growth; organic traffic requires correct metadata
4. **S12 — Reviews** — trust; social proof directly increases conversion rate
5. **S13 — Wishlist** — retention; free return-visit mechanism for window shoppers
6. **S14 — Inventory** — ops; overselling kills fulfilment credibility
7. **S15 — Discounts** — growth; required for launch campaign and influencer codes
8. **S16 — Analytics** — ops; founder needs daily KPI visibility to make decisions
9. **S17 — Production Hardening** — reliability; rate limiting + Sentry before real traffic
10. **S18 — CI/CD & Deploy** — reliability; nothing ships without an automated deploy pipeline
11. **S19 — Returns & Refunds** — trust; no D2C brand survives without a working refund path
12. **S20 — Customer Account** — retention; customers need a profile, address book, and order history
13. **S21 — Drop Engine** — growth; ASUR is a drop brand — scheduling and countdowns are core to the identity
14. **S22 — PWA** — platform; replaces native mobile with an installable, offline-capable web app
15. **S23 — Abandoned Cart Recovery** — revenue; ~70% cart abandonment rate means automated recovery is high-ROI

---

## Sprint 9 — Transactional Email Notifications

| | |
|--|--|
| **Theme** | Trust |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Goal

Every customer-facing event (order placed, payment confirmed, shipped) sends a real email. Without this, customers have no paper trail and will not trust the store.

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S9-T1 | Set up Resend API + email service module at `apps/backend/src/services/email.service.ts` | ✅ DONE |
| S9-T2 | Order confirmation email: HTML template with order number, items, total, address | ✅ DONE |
| S9-T3 | Payment confirmed email: receipt with Razorpay payment ID and amount | ✅ DONE |
| S9-T4 | Shipping update email: triggered when vendor marks task completed, includes tracking ID | ✅ DONE |
| S9-T5 | Admin new-order notification: internal email to ops when a paid order arrives | ✅ DONE |
| S9-T6 | Email queue: wrap sends in try/catch so a failed email never breaks the payment flow | ✅ DONE |

---

## Sprint 10 — Search, Filtering & Discovery

| | |
|--|--|
| **Theme** | Conversion |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S10-T1 | Backend: full-text search on `GET /api/v1/products?q=` using MongoDB `$text` index | ✅ DONE |
| S10-T2 | Backend: filter params — category, fit, inStock, minPrice, maxPrice, size, color | ✅ DONE |
| S10-T3 | Backend: sort param — newest, price_asc, price_desc, popularity | ✅ DONE |
| S10-T4 | Web: search bar in header — inline on desktop, full-screen overlay on mobile | ✅ DONE |
| S10-T5 | Web: filter sheet — category, size, color, price range, in-stock toggle | ✅ DONE |
| S10-T6 | Web: active filter chips with individual remove buttons | ✅ DONE |

---

## Sprint 11 — SEO, Metadata & Structured Data

| | |
|--|--|
| **Theme** | Growth |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S11-T1 | Split `"use client"` pages into server wrapper + client child for `generateMetadata` | ✅ DONE |
| S11-T2 | Product detail: `generateMetadata` with title, description, OG image, price, availability | ✅ DONE |
| S11-T3 | Products listing: static metadata + collection-level metadata | ✅ DONE |
| S11-T4 | JSON-LD: Product schema on PDP with name, image, price, currency, availability, brand | ✅ DONE |
| S11-T5 | Sitemap.xml: route listing all active product slugs | ✅ DONE |
| S11-T6 | `robots.txt` + canonical URLs + hreflang (en-IN) + 404 page | ✅ DONE |

---

## Sprint 12 — Product Reviews & Social Proof

| | |
|--|--|
| **Theme** | Trust |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S12-T1 | Review model: `orderId`, `customerId`, `productId`, `rating`, `body`, `verified` | ✅ DONE |
| S12-T2 | `POST /api/v1/reviews` — validates customer has paid+delivered order for the product | ✅ DONE |
| S12-T3 | `GET /api/v1/products/:slug/reviews` — paginated, includes aggregate rating + count | ✅ DONE |
| S12-T4 | Admin: review moderation panel — approve/reject; only approved reviews show publicly | ✅ DONE |
| S12-T5 | Web PDP: star rating display + review count; scrollable review list | ✅ DONE |
| S12-T6 | Web: post-delivery review prompt on order detail page when status is `delivered` | ✅ DONE |

---

## Sprint 13 — Wishlist & Save for Later

| | |
|--|--|
| **Theme** | Retention |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S13-T1 | Wishlist model: `customerId`, `items: [productId, variantSku, addedAt]` | ✅ DONE |
| S13-T2 | `GET`/`POST`/`DELETE /api/v1/wishlist` — authenticated | ✅ DONE |
| S13-T3 | Web: heart icon on product cards and PDP — optimistic toggle | ✅ DONE |
| S13-T4 | Web: `/wishlist` page — grid of saved products with Move to Cart CTA | ✅ DONE |
| S13-T5 | Web: wishlist count badge in header | ✅ DONE |
| S13-T6 | Web: unauthenticated heart click redirects to auth then restores intent | ✅ DONE |

---

## Sprint 14 — Real-Time Inventory & Stock Management

| | |
|--|--|
| **Theme** | Operations |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S14-T1 | Atomic stock decrement on order creation via `$inc`; race-condition guard | ✅ DONE |
| S14-T2 | Stock release on order cancellation | ✅ DONE |
| S14-T3 | Low-stock alert email to admin when any variant drops below 5 units | ✅ DONE |
| S14-T4 | Admin: inventory panel with sortable stock column, inline edit, low-stock badge | ✅ DONE |
| S14-T5 | Admin: bulk stock update via CSV upload | ✅ DONE |
| S14-T6 | Web: back-in-stock notification signup on OOS PDP | ✅ DONE |

---

## Sprint 15 — Discount Codes & Promotions

| | |
|--|--|
| **Theme** | Growth |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S15-T1 | Coupon model: `code`, `type`, `value`, `minOrderValue`, `usageLimit`, `usedCount`, `expiresAt` | ✅ DONE |
| S15-T2 | `POST /api/v1/coupons/validate` — checks code, usage, expiry, min order | ✅ DONE |
| S15-T3 | Apply coupon to order — store `couponCode` + `discountAmount`; subtract from total | ✅ DONE |
| S15-T4 | Admin: coupon CRUD — create, list, pause/activate, view usage count | ✅ DONE |
| S15-T5 | Web checkout: coupon code field with Apply/Remove and discount line in review step | ✅ DONE |
| S15-T6 | Web: coupon error states — expired, invalid, min order not met, already used | ✅ DONE |

---

## Sprint 16 — Admin Analytics Dashboard

| | |
|--|--|
| **Theme** | Operations |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S16-T1 | `GET /api/v1/admin/analytics` — GMV 7d/30d with % change, orders, AOV, top 5 products | ✅ DONE |
| S16-T2 | `GET /api/v1/admin/analytics/revenue-chart` — 30-day daily data, all gaps filled | ✅ DONE |
| S16-T3 | Admin dashboard: KPI tiles with 7d/30d toggle and % change vs prior period | ✅ DONE |
| S16-T4 | Admin: pure SVG bar chart (no Recharts dependency) | ✅ DONE |
| S16-T5 | Admin: top products table ranked by revenue with relative bars | ✅ DONE |
| S16-T6 | Admin: CSV export of all orders as streaming blob download | ✅ DONE |

---

## Sprint 17 — Production Hardening & Observability

| | |
|--|--|
| **Theme** | Reliability |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | ✅ DONE |

### Tasks

| Task ID | Description | Status |
|---------|-------------|--------|
| S17-T1 | Rate limiting: 100/min global, 10/min auth, 20/min payments via `express-rate-limit` | ✅ DONE |
| S17-T2 | Pino structured logging: every request logs method, path, status, duration | ✅ DONE |
| S17-T3 | Sentry: backend Node SDK + web Next.js SDK; gated on `SENTRY_DSN` env var | ✅ DONE |
| S17-T4 | Enhanced `/health`: DB ping latency, uptime, version, env | ✅ DONE |
| S17-T5 | Helmet CSP: allows Razorpay, Firebase, R2 domains only | ✅ DONE |
| S17-T6 | k6 load test script: 50 VUs across browse/cart/checkout; p95 < 2s threshold | ✅ DONE |

---

## Sprint 18 — CI/CD & Railway Deployment

| | |
|--|--|
| **Theme** | Reliability |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO ← **next** |

### Goal

Nothing is deployed anywhere. Before real traffic hits, you need automated deploys with zero-downtime swaps, environment parity, and rollback capability. S18 and S19 are hard launch blockers.

### Tasks

| Task ID | Description | Effort |
|---------|-------------|--------|
| S18-T1 | GitHub Actions CI pipeline: typecheck + build on every PR | ✅ DONE |
| S18-T2 | Railway backend service: `railway.toml` + `nixpacks.toml`, health check path `/health` | ✅ DONE |
| S18-T3 | Railway web + admin services: `railway.toml` + `nixpacks.toml` per app | ✅ DONE |
| S18-T4 | Zero-downtime: Railway uses `GET /health` (S17) as readiness probe | ✅ DONE |
| S18-T5 | Preview environments: `preview.yml` workflow deploys Railway PR environment + posts URL comment | ✅ DONE |
| S18-T6 | Production bootstrap: `bootstrap-prod.ts` script + `pnpm bootstrap:prod` command | ✅ DONE |

### Key Files

- `.github/workflows/ci.yml` (new)
- `.github/workflows/deploy.yml` (new)
- `railway.toml` (new — service config)
- `apps/backend/Dockerfile` (new — or nixpacks config)

---

## Sprint 19 — Returns & Refunds

| | |
|--|--|
| **Theme** | Trust |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

No D2C brand survives without a return policy that works end-to-end. Customers expect a form, a confirmation email, and a real Razorpay refund. Without this, post-purchase trust collapses.

### Tasks

| Task ID | Description | Effort |
|---------|-------------|--------|
| S19-T1 | Return model: `orderId`, `items[]`, `reason`, `status (requested→approved→refunded)`, `refundId` | M |
| S19-T2 | `POST /api/v1/orders/:id/return` — authenticated; validates within 7-day return window | M |
| S19-T3 | Admin returns queue: list pending requests, approve/reject with one click | M |
| S19-T4 | Razorpay refund API: trigger `refund.create` on approval; store `refundId` on order | L |
| S19-T5 | Email: return confirmation + refund-initiated email with amount and estimated timeline | M |
| S19-T6 | Web: "Request Return" button on delivered order detail page with reason dropdown | S |

### Key Files

- `apps/backend/src/models/return.model.ts` (new)
- `apps/backend/src/controllers/return.controller.ts` (new)
- `apps/backend/src/routes/return.routes.ts` (new)
- `apps/admin/app/returns/page.tsx` (new)
- `apps/web/app/orders/[id]/page.tsx` (add return button)

---

## Sprint 20 — Customer Account & Profile

| | |
|--|--|
| **Theme** | Retention |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

There is no `/account` page. Customers can't manage addresses, see their full order history, or update their profile. This is a baseline UX expectation for any store.

### Tasks

| Task ID | Description | Effort |
|---------|-------------|--------|
| S20-T1 | `/account` page with tabs: Profile / Orders / Addresses / Wishlist | M |
| S20-T2 | Editable profile: name, phone, avatar upload to R2 | M |
| S20-T3 | Address book: add/edit/delete saved addresses; set default | M |
| S20-T4 | Orders tab: full history with status badges and re-order button | S |
| S20-T5 | Account deletion: self-service data deletion request (GDPR/IT Act compliance) | M |
| S20-T6 | Header: replace auth button with avatar dropdown linking to account sections | S |

### Key Files

- `apps/web/app/account/page.tsx` (new)
- `apps/web/app/account/profile/page.tsx` (new)
- `apps/web/app/account/addresses/page.tsx` (new)
- `apps/backend/src/controllers/customer.controller.ts` (extend with address CRUD)
- `apps/web/components/site-header.tsx` (avatar dropdown)

---

## Sprint 21 — Drop / Flash Sale Engine

| | |
|--|--|
| **Theme** | Growth |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

ASUR is a drop brand. Right now there is no way to schedule a release, run a countdown, or create urgency around a launch. This is a core part of the brand identity and a direct conversion lever.

### Tasks

| Task ID | Description | Effort |
|---------|-------------|--------|
| S21-T1 | `Drop` model: `name`, `slug`, `scheduledAt`, `products[]`, `status (upcoming→live→ended)` | M |
| S21-T2 | Admin: drop scheduler — create a drop, attach products, set go-live datetime | M |
| S21-T3 | Backend: cron job flips drop status at `scheduledAt`; publishes products atomically | L |
| S21-T4 | Web: countdown clock on PDP and homepage hero for the next upcoming drop | M |
| S21-T5 | Drop waitlist: email signup before a drop goes live; blast email when it opens | M |
| S21-T6 | "Only N left" live badge on PDP during active drops (polls stock every 30s) | S |

### Key Files

- `apps/backend/src/models/drop.model.ts` (new)
- `apps/backend/src/controllers/drop.controller.ts` (new)
- `apps/backend/src/routes/drop.routes.ts` (new)
- `apps/admin/app/drops/page.tsx` (new)
- `apps/web/components/countdown-timer.tsx` (new)
- `apps/web/app/page.tsx` (wire in next drop countdown)

---

## Sprint 22 — PWA & Performance

| | |
|--|--|
| **Theme** | Platform |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

With no native app, a Progressive Web App gives customers an installable, app-like experience on Android and iOS Safari with zero App Store friction. Also addresses Core Web Vitals before any SEO scale.

### Tasks

| Task ID | Description | Effort |
|---------|-------------|--------|
| S22-T1 | `manifest.json` + service worker via `next-pwa`; full app icon set | M |
| S22-T2 | Offline shell: cache home + product listing for repeat visitors | M |
| S22-T3 | "Add to Home Screen" install prompt banner on mobile after second visit | M |
| S22-T4 | Image optimisation audit: all product images through Next.js `<Image>` with proper `sizes` | S |
| S22-T5 | Lighthouse CI check in GitHub Actions: fail PR if LCP > 2.5s or CLS > 0.1 | M |
| S22-T6 | Web Push notifications: opt-in on order confirmation; notify on ship event | L |

### Key Files

- `apps/web/public/manifest.json` (new)
- `apps/web/next.config.mjs` (add `next-pwa`)
- `.github/workflows/lighthouse.yml` (new)

---

## Sprint 23 — Abandoned Cart Recovery

| | |
|--|--|
| **Theme** | Revenue |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

Industry average cart abandonment is ~70%. An automated recovery email sequence is one of the highest-ROI additions to any e-commerce store. No infrastructure needed beyond what's already built.

### Tasks

| Task ID | Description | Effort |
|---------|-------------|--------|
| S23-T1 | Persist authed cart to DB on every add-to-cart event (TTL 7 days) | M |
| S23-T2 | Cron: query carts with items added > 1 hour ago, no completed order, email not yet sent | M |
| S23-T3 | Recovery email #1 (1h): product images, prices, one-click resume cart link (signed URL) | M |
| S23-T4 | Recovery email #2 (24h): same cart + auto-generated 5% nudge coupon | M |
| S23-T5 | Admin: abandoned cart dashboard — count, recovery rate, revenue recovered | M |
| S23-T6 | Unsubscribe: one-click opt-out from recovery emails stored on customer record | S |

### Key Files

- `apps/backend/src/models/cart.model.ts` (new — persisted cart)
- `apps/backend/src/services/cart-recovery.service.ts` (new)
- `apps/backend/src/jobs/cart-recovery.job.ts` (new — cron)
- `apps/admin/app/analytics/abandoned-carts/page.tsx` (new)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `TODO` | Not started |
| `IN PROGRESS` | Actively being worked on |
| `BLOCKED` | Waiting on a dependency |
| `✅ DONE` | Finished and verified |

## Effort Legend

| Size | Typical scope |
|------|---------------|
| `S` | < 2 hours — single file, isolated change |
| `M` | 2–6 hours — a few files, one feature slice |
| `L` | 6–12 hours — cross-cutting, multiple layers |

---

*ASUR · Sprint Roadmap · Confidential*
