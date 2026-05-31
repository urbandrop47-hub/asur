# ASUR — Sprint Roadmap Phase 2 (Sprints 9–18)

**Launch-Ready Feature Backlog**  
Prepared June 2026 · 10 Sprints · 60 Tasks

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
12. [Sprint 18 — React Native / Expo Mobile App Phase 1](#sprint-18--react-native--expo-mobile-app-phase-1)

---

## Sprint Summary

10 sprints. 60 tasks. Everything needed to go from functional MVP to a store that earns customer trust, drives organic growth, and can handle real-world traffic.

| Sprint | Title | Theme | Duration | Tasks | Status |
|--------|-------|-------|----------|-------|--------|
| S9 | Transactional Email Notifications | Trust | 1 week | 6 | TODO |
| S10 | Search, Filtering & Discovery | Conversion | 1.5 weeks | 6 | TODO |
| S11 | SEO, Metadata & Structured Data | Growth | 1 week | 6 | TODO |
| S12 | Product Reviews & Social Proof | Trust | 1.5 weeks | 6 | TODO |
| S13 | Wishlist & Save for Later | Retention | 1 week | 6 | TODO |
| S14 | Real-Time Inventory & Stock Management | Operations | 1 week | 6 | TODO |
| S15 | Discount Codes & Promotions | Growth | 1.5 weeks | 6 | TODO |
| S16 | Admin Analytics Dashboard | Operations | 1.5 weeks | 6 | TODO |
| S17 | Production Hardening & Observability | Reliability | 1 week | 6 | TODO |
| S18 | React Native / Expo Mobile App (Phase 1) | Platform | 2 weeks | 6 | TODO |

---

## Execution Order Rationale

The sprints are ordered by **customer impact × risk**. Sprints 9–11 unblock the launch: without email, customers don't trust the store; without SEO, no organic traffic arrives. Sprints 12–15 build retention and revenue levers. Sprints 16–17 give the team the visibility and reliability needed to operate at scale. Sprint 18 opens the mobile channel.

1. **S9 — Email** — trust baseline; without this, paid orders have no paper trail
2. **S10 — Search & Filter** — conversion; customers can't buy what they can't find
3. **S11 — SEO & Metadata** — growth; organic traffic requires correct metadata
4. **S12 — Reviews** — trust; social proof directly increases conversion rate
5. **S13 — Wishlist** — retention; free return-visit mechanism for window shoppers
6. **S14 — Inventory** — ops; overselling kills fulfilment credibility
7. **S15 — Discounts** — growth; required for launch campaign and influencer codes
8. **S16 — Analytics** — ops; founder needs daily KPI visibility to make decisions
9. **S17 — Production Hardening** — reliability; rate limiting + Sentry before real traffic
10. **S18 — Mobile App** — platform; native app is the highest-trust signal for Indian D2C

> **Total estimated timeline:** 13–15 weeks for a solo developer; 6–8 weeks with two developers working in parallel on frontend and backend tracks.

---

## Sprint 9 — Transactional Email Notifications

| | |
|--|--|
| **Theme** | Trust |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

Every customer-facing event (order placed, payment confirmed, shipped) sends a real email. Without this, customers have no paper trail and will not trust the store.

### Stack & Touchpoints

- Resend (email API)
- React Email (templates)
- `apps/backend` (email service)
- `apps/web` (confirmation page)

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S9-T1 | Set up Resend API + email service module at `apps/backend/src/services/email.service.ts` | TODO | S | Backend |
| S9-T2 | Order confirmation email: HTML template with order number, items, total, address | TODO | M | Backend |
| S9-T3 | Payment confirmed email: receipt with Razorpay payment ID and amount | TODO | S | Backend |
| S9-T4 | Shipping update email: triggered when vendor marks task completed, includes tracking ID and courier | TODO | M | Backend |
| S9-T5 | Admin new-order notification: internal email to ops when a paid order arrives | TODO | S | Backend |
| S9-T6 | Email queue: wrap sends in try/catch so a failed email never breaks the payment or order flow | TODO | S | Backend |

### Acceptance Criteria

1. Placing an order sends a confirmation email within 5 seconds
2. Payment verified endpoint triggers a receipt email
3. Vendor marking task completed triggers a shipping email with tracking link
4. Failed email sends are logged but do not cause API errors
5. All emails render correctly on Gmail mobile and Outlook desktop

### Key Files

- `apps/backend/src/services/email.service.ts` (new)
- `apps/backend/src/services/email-templates/` (new — React Email or MJML)
- `apps/backend/src/controllers/order.controller.ts` (wire send after order created)
- `apps/backend/src/controllers/payment.controller.ts` (wire send after payment verified)
- `apps/backend/src/controllers/vendor.controller.ts` (wire send after task completed)

---

## Sprint 10 — Search, Filtering & Discovery

| | |
|--|--|
| **Theme** | Conversion |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

Customers browsing 10+ products need to find what they want. A store with no search or filter is dead at scale. This sprint adds full-text search and faceted filtering to the product grid.

### Stack & Touchpoints

- MongoDB Atlas Search (or Mongoose `$text` index)
- `apps/web` search overlay
- `apps/backend` search route

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S10-T1 | Backend: add full-text search to `GET /api/v1/products?q=` using MongoDB `$text` index on title + description | TODO | M | Backend |
| S10-T2 | Backend: add filter params to product list — category, fit, inStock, minPrice, maxPrice, size, color | TODO | M | Backend |
| S10-T3 | Backend: add sort param — newest, price_asc, price_desc, popularity | TODO | S | Backend |
| S10-T4 | Web: search bar in site header — expands inline on desktop, full-screen overlay on mobile | TODO | L | Frontend |
| S10-T5 | Web: filter sheet on products page — category, size, color, price range, in-stock toggle | TODO | M | Frontend |
| S10-T6 | Web: active filter chips below header showing applied filters with individual remove buttons | TODO | S | Frontend |

### Acceptance Criteria

1. Searching "oversized" returns all products with that keyword in title or description
2. Filtering by `size=L` only shows products that have an L variant with `stock > 0`
3. Filter sheet is a bottom drawer on mobile, side panel on desktop
4. Active filters persist across page navigation (URL params)
5. Clearing all filters returns the full catalogue
6. Results update without full page reload

### Key Files

- `apps/backend/src/controllers/product.controller.ts` (add query params)
- `apps/backend/src/repositories/product.repository.ts` (add search/filter methods)
- `apps/web/components/site-header.tsx` (search bar)
- `apps/web/app/products/page.tsx` (filter state + URL params)
- `apps/web/components/asur/filter-sheet.tsx` (extend existing)

---

## Sprint 11 — SEO, Metadata & Structured Data

| | |
|--|--|
| **Theme** | Growth |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

Every page title is "ASUR — Neither Divine. Nor Damned." Product pages have no OG images. Google indexes the site with no useful data. This sprint makes the store discoverable.

### Stack & Touchpoints

- Next.js `generateMetadata`
- `next-sitemap` or custom sitemap route
- JSON-LD
- Open Graph

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S11-T1 | Split all `"use client"` pages into a server wrapper + client child so `generateMetadata` can be exported | TODO | L | Frontend |
| S11-T2 | Product detail: `generateMetadata` with title, description, OG image (`product.media[0].url`), price, availability | TODO | M | Frontend |
| S11-T3 | Products listing: static metadata + collection-level metadata for `/collections/[slug]` | TODO | S | Frontend |
| S11-T4 | JSON-LD: Product schema on PDP with name, image, price, currency, availability, brand | TODO | M | Frontend |
| S11-T5 | Sitemap.xml: route at `/sitemap.xml` listing all active product slugs fetched from backend | TODO | M | Frontend |
| S11-T6 | `robots.txt` + canonical URLs + hreflang (en-IN) + 404 page with proper metadata | TODO | S | Frontend |

### Acceptance Criteria

1. Sharing a product URL on WhatsApp/Twitter shows product image, title, and price in the preview
2. Google Search Console can crawl all product URLs via `sitemap.xml`
3. Product pages score 90+ on Lighthouse SEO audit
4. No duplicate title tags across any two pages
5. Structured data passes Google Rich Results Test for Product schema

### Key Files

- `apps/web/app/products/[slug]/page.tsx` (server wrapper + `generateMetadata`)
- `apps/web/app/products/page.tsx` (static metadata)
- `apps/web/app/sitemap.ts` (new — Next.js 15 sitemap route)
- `apps/web/app/robots.ts` (new)
- `apps/web/app/products/[slug]/json-ld.tsx` (new — Product JSON-LD component)

---

## Sprint 12 — Product Reviews & Social Proof

| | |
|--|--|
| **Theme** | Trust |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

No reviews means no trust. Real stores show verified-purchase ratings on every product card and PDP. This sprint adds the full review lifecycle: submit, moderate, display.

### Stack & Touchpoints

- MongoDB Review model
- Backend review routes
- Web review form + display

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S12-T1 | Backend: Review Mongoose model (`orderId`, `customerId`, `productId`, `rating` 1–5, `body`, `verified`, `createdAt`) | TODO | M | Backend |
| S12-T2 | Backend: `POST /api/v1/reviews` — authenticated, validates that `customerId` has a paid+delivered order for the `productId` | TODO | M | Backend |
| S12-T3 | Backend: `GET /api/v1/products/:slug/reviews` — paginated, sorted by newest; includes aggregate rating + count | TODO | S | Backend |
| S12-T4 | Admin: review moderation panel — approve/reject reviews; only approved reviews show publicly | TODO | M | Admin |
| S12-T5 | Web PDP: star rating display + review count; scrollable review list below the fold | TODO | M | Frontend |
| S12-T6 | Web: post-delivery review prompt — shown on order detail page when status is `delivered`; links to review form | TODO | S | Frontend |

### Acceptance Criteria

1. Only customers with a paid+delivered order for the product can leave a review
2. Reviews require admin approval before appearing publicly
3. Product card shows average rating as filled stars with review count
4. PDP shows a breakdown (5★: N, 4★: N, etc.) and paginated review list
5. Submitting a review shows confirmation and disables the form to prevent duplicates

### Key Files

- `apps/backend/src/models/review.model.ts` (new)
- `apps/backend/src/repositories/review.repository.ts` (new)
- `apps/backend/src/controllers/review.controller.ts` (new)
- `apps/backend/src/routes/reviews.routes.ts` (new)
- `apps/admin/app/reviews/page.tsx` (new — moderation queue)
- `apps/web/app/products/[slug]/page.tsx` (add reviews section)
- `apps/web/components/star-rating.tsx` (new)

---

## Sprint 13 — Wishlist & Save for Later

| | |
|--|--|
| **Theme** | Retention |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

Customers browsing a drop they can't afford right now should be able to save it. Wishlists are a free retention tool — they bring customers back. A store without one loses browsers who aren't ready to buy.

### Stack & Touchpoints

- MongoDB Wishlist model
- Backend wishlist routes
- Web wishlist page + heart icon

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S13-T1 | Backend: Wishlist model (`customerId`, `items: [productId, variantSku, addedAt]`) | TODO | S | Backend |
| S13-T2 | Backend: `GET`/`POST`/`DELETE /api/v1/wishlist` — add/remove items, list all; authenticated | TODO | M | Backend |
| S13-T3 | Web: heart icon on every product card and PDP — filled if in wishlist, outline if not; toggles on click | TODO | M | Frontend |
| S13-T4 | Web: `/wishlist` page — grid of saved products with remove button and Move to Cart CTA | TODO | M | Frontend |
| S13-T5 | Web: wishlist count badge on header icon (next to cart icon) | TODO | S | Frontend |
| S13-T6 | Web: if unauthenticated user clicks heart, prompt sign-in then persist the intent after login | TODO | M | Frontend |

### Acceptance Criteria

1. Clicking the heart on a product card adds it to the wishlist without page reload
2. Wishlist count in the header updates immediately
3. Moving an item to cart from `/wishlist` adds it and removes it from the wishlist
4. Wishlist state persists across page refreshes (server-stored, not localStorage)
5. Unauthenticated wishlist click redirects to `/auth?next=/wishlist` and restores intent

### Key Files

- `apps/backend/src/models/wishlist.model.ts` (new)
- `apps/backend/src/controllers/wishlist.controller.ts` (new)
- `apps/backend/src/routes/wishlist.routes.ts` (new)
- `apps/web/app/wishlist/page.tsx` (new)
- `apps/web/components/heart-button.tsx` (new)
- `apps/web/store/wishlist-store.ts` (new — mirrors cart-store pattern)
- `apps/web/components/site-header.tsx` (add wishlist badge)

---

## Sprint 14 — Real-Time Inventory & Stock Management

| | |
|--|--|
| **Theme** | Operations |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

Right now stock is never decremented when an order is placed — two customers can buy the last unit. This sprint implements atomic stock reservation, low-stock alerts, and restocking workflows.

### Stack & Touchpoints

- MongoDB `findOneAndUpdate` atomic ops
- Admin inventory panel
- Email alerts

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S14-T1 | Backend: atomic stock decrement on order creation — use `$inc` operator to decrement `variant.stock`; rollback if order fails | TODO | L | Backend |
| S14-T2 | Backend: stock release on order cancellation — increment stock back when order status moves to `cancelled` | TODO | M | Backend |
| S14-T3 | Backend: low-stock alert — trigger email to admin when any variant drops below 5 units | TODO | M | Backend |
| S14-T4 | Admin: inventory panel at `/inventory` with sortable stock column, inline stock edit, and low-stock badge | TODO | M | Admin |
| S14-T5 | Admin: bulk stock update — CSV upload of `(sku, stock)` pairs to restock after a drop | TODO | L | Admin |
| S14-T6 | Web: back-in-stock notification signup — email field on OOS product page; email sent when stock restored | TODO | M | Frontend |

### Acceptance Criteria

1. Two concurrent orders for the last unit: only one succeeds; the other gets a 409 with a clear message
2. Cancelling an order restores the reserved stock
3. Admin receives an email when any variant hits 5 units remaining
4. Back-in-stock signup stores the email and triggers notification on restock
5. Bulk CSV upload correctly adjusts stock for all SKUs in the file

### Key Files

- `apps/backend/src/repositories/product.repository.ts` (atomic stock ops)
- `apps/backend/src/services/order.service.ts` (wire stock decrement + release)
- `apps/backend/src/services/inventory.service.ts` (new — alerts, notifications)
- `apps/admin/app/inventory/page.tsx` (new)
- `apps/admin/app/inventory/bulk-upload.tsx` (new)
- `apps/web/app/products/[slug]/page.tsx` (OOS notification form)

---

## Sprint 15 — Discount Codes & Promotions

| | |
|--|--|
| **Theme** | Growth |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

Without discount codes there is no lever for launch campaigns, influencer partnerships, or abandoned-cart recovery. This sprint adds a complete promo engine.

### Stack & Touchpoints

- MongoDB Coupon model
- Backend coupon routes
- Checkout coupon field

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S15-T1 | Backend: Coupon model (`code`, `type: percent\|fixed\|free_shipping`, `value`, `minOrderValue`, `usageLimit`, `usedCount`, `expiresAt`, `isActive`) | TODO | M | Backend |
| S15-T2 | Backend: `POST /api/v1/coupons/validate` — checks code validity, usage, expiry, min order; returns discount amount | TODO | M | Backend |
| S15-T3 | Backend: apply coupon to order — store `couponCode` + `discountAmount` on Order; subtract from total | TODO | M | Backend |
| S15-T4 | Admin: coupon management CRUD — create, list, pause/activate, view usage count per code | TODO | M | Admin |
| S15-T5 | Web checkout: coupon code field between address and review steps — shows discount applied in review step | TODO | M | Frontend |
| S15-T6 | Web: coupon error states — expired, invalid, min order not met, already used (per account for single-use codes) | TODO | S | Frontend |

### Acceptance Criteria

1. Admin creates `LAUNCH20` for 20% off; customer applies it at checkout and sees a discount line item
2. Expired codes return a clear error message
3. Single-use codes cannot be reused by the same account
4. Discount is applied before GST calculation
5. Order record stores the applied coupon code and discount amount
6. Admin can see total redemptions per code

### Key Files

- `apps/backend/src/models/coupon.model.ts` (new)
- `apps/backend/src/controllers/coupon.controller.ts` (new)
- `apps/backend/src/routes/coupon.routes.ts` (new)
- `apps/admin/app/coupons/page.tsx` (new)
- `apps/web/app/checkout/page.tsx` (coupon field in step 2)
- `apps/backend/src/repositories/order.repository.ts` (store coupon on order)
- `packages/types/src/index.ts` (add `couponCode` + `discountAmount` to `Order`)

---

## Sprint 16 — Admin Analytics Dashboard

| | |
|--|--|
| **Theme** | Operations |
| **Duration** | 1.5 weeks |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

An admin who cannot see revenue, conversion, or top products cannot run the store. This sprint builds a real-time dashboard with the KPIs a founder needs every morning.

### Stack & Touchpoints

- MongoDB aggregation pipeline
- `apps/admin` dashboard
- Chart library (Recharts or Victory)

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S16-T1 | Backend: `GET /api/v1/admin/analytics` — returns GMV (7d/30d), orders count, AOV, top 5 products by revenue, funnel visits→cart→checkout→paid | TODO | L | Backend |
| S16-T2 | Backend: `GET /api/v1/admin/analytics/revenue-chart` — daily revenue for last 30 days (for sparkline chart) | TODO | M | Backend |
| S16-T3 | Admin: dashboard homepage (`/admin`) — KPI tiles: GMV, orders, AOV, conversion rate; replaces current placeholder | TODO | M | Admin |
| S16-T4 | Admin: revenue sparkline chart — 30-day daily revenue bar chart using Recharts | TODO | M | Admin |
| S16-T5 | Admin: top products table — ranked by units sold and revenue; click through to product edit | TODO | S | Admin |
| S16-T6 | Admin: CSV export — download orders as CSV with order number, customer email, items, total, status, date | TODO | M | Admin |

### Acceptance Criteria

1. Dashboard loads in < 2 seconds with real MongoDB data
2. GMV and order counts are accurate to the last completed order
3. Revenue chart updates when new orders arrive (manual refresh)
4. CSV export produces a valid file that opens in Excel with correct columns
5. All KPI tiles show comparison vs previous period (e.g. +12% vs last week)

### Key Files

- `apps/backend/src/controllers/analytics.controller.ts` (new)
- `apps/backend/src/routes/analytics.routes.ts` (new)
- `apps/admin/app/page.tsx` (replace placeholder with real dashboard)
- `apps/admin/components/kpi-tile.tsx` (new)
- `apps/admin/components/revenue-chart.tsx` (new — Recharts)
- `apps/admin/components/top-products-table.tsx` (new)

---

## Sprint 17 — Production Hardening & Observability

| | |
|--|--|
| **Theme** | Reliability |
| **Duration** | 1 week |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

The store is feature-complete but not production-safe. Rate limiting, structured logging, health checks, and error tracking must be in place before real traffic hits.

### Stack & Touchpoints

- `express-rate-limit`
- Pino (structured logging)
- Sentry (error tracking)
- Railway health endpoints

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S17-T1 | Rate limiting: 100 req/min per IP on all routes; stricter limits on `POST /auth/session` (10/min) and payment routes (20/min) | TODO | M | Backend |
| S17-T2 | Structured logging with Pino: replace `console.log` with Pino logger; log request method, path, status, duration on every request | TODO | M | Backend |
| S17-T3 | Sentry integration: backend (Node SDK) + web (Next.js SDK); capture unhandled errors with request context | TODO | M | Both |
| S17-T4 | Health check enhancement: `GET /health` returns DB ping latency, uptime, version, env; used by Railway for zero-downtime deploys | TODO | S | Backend |
| S17-T5 | Security headers: `helmet.js` on all routes; CSP that allows only Razorpay, Firebase, and R2 domains | TODO | M | Backend |
| S17-T6 | Load test: k6 script simulating 50 concurrent users browsing + adding to cart + checking out; document results | TODO | L | DevOps |

### Acceptance Criteria

1. Sending 200 requests/min from one IP returns 429 after the 100th
2. Every API request appears in Railway logs with method, path, status, and duration
3. Triggering an unhandled error sends an event to Sentry with a stack trace
4. `/health` returns 200 with DB latency < 50 ms under normal conditions
5. k6 test shows P99 response time < 500 ms for product listing under 50 concurrent users

### Key Files

- `apps/backend/src/app.ts` (rate limiting, helmet, Pino middleware)
- `apps/backend/src/lib/logger.ts` (new — Pino instance)
- `apps/backend/src/lib/sentry.ts` (new)
- `apps/web/sentry.client.config.ts` (new)
- `apps/web/sentry.server.config.ts` (new)
- `k6/load-test.js` (new — load test script)

---

## Sprint 18 — React Native / Expo Mobile App (Phase 1)

| | |
|--|--|
| **Theme** | Platform |
| **Duration** | 2 weeks |
| **Tasks** | 6 |
| **Status** | TODO |

### Goal

ASUR is mobile-first. A native app unlocks push notifications, faster load times, App Store presence, and the single biggest trust signal for Indian D2C brands. This sprint ships a read-only catalogue app with auth; cart and checkout follow in Phase 2.

### Stack & Touchpoints

- Expo (React Native)
- Firebase Auth (same project as web)
- NativeWind or StyleSheet
- Expo Router

### Tasks

| Task ID | Description | Status | Effort | Owner |
|---------|-------------|--------|--------|-------|
| S18-T1 | Bootstrap Expo app at `apps/mobile` with Expo Router; configure Firebase Auth with the same project as web | TODO | L | Mobile |
| S18-T2 | Auth screens: sign in with Google + email/password using `expo-auth-session`; exchange Firebase token with backend | TODO | L | Mobile |
| S18-T3 | Product listing screen: grid of cards fetching from `GET /api/v1/products`; pull-to-refresh; skeleton loaders | TODO | M | Mobile |
| S18-T4 | Product detail screen: image gallery (`FlatList` with horizontal scroll), variant selector, stock badge, price | TODO | M | Mobile |
| S18-T5 | Order history screen: list of past orders from `GET /api/v1/orders`; tap to see order detail with timeline | TODO | M | Mobile |
| S18-T6 | Push notifications: Expo push token stored on backend; notify customer when order is shipped | TODO | L | Mobile |

### Acceptance Criteria

1. App installs and runs on iOS 16+ and Android 13+ via Expo Go
2. Sign-in with Google works end-to-end on a physical device
3. Product listing fetches from the same backend as the web app
4. Order history shows the same orders as the web app for the same account
5. Shipping push notification arrives within 30 seconds of vendor marking task complete

### Key Files

- `apps/mobile/` (new Expo project)
- `apps/mobile/app/(tabs)/index.tsx` (product listing)
- `apps/mobile/app/(tabs)/orders.tsx` (order history)
- `apps/mobile/app/product/[slug].tsx` (PDP)
- `apps/mobile/app/auth.tsx` (sign-in screen)
- `apps/backend/src/controllers/auth.controller.ts` (store push token)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `TODO` | Not started |
| `IN PROGRESS` | Actively being worked on |
| `BLOCKED` | Waiting on a dependency |
| `DONE` | Finished and verified |

## Effort Legend

| Size | Typical scope |
|------|---------------|
| `S` | < 2 hours — single file, isolated change |
| `M` | 2–6 hours — a few files, one feature slice |
| `L` | 6–12 hours — cross-cutting, multiple layers |

---

*ASUR · Phase 2 Roadmap · Confidential*
