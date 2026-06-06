# ASUR — Team Handover: System Overview & Module Map

> **Branch:** `ridam` · **Status:** All sprints S1–S48 complete, builds clean, uncommitted  
> **Stack:** Next.js 15 / React 19 · Express TypeScript · MongoDB Atlas · Firebase Auth · Razorpay · Cloudflare R2

---

## 1. Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                  │
│  weareasur.in          admin panel          vendor portal        │
│  apps/web (3000)   apps/admin (3001)   apps/vendor (3002)       │
│  Next.js 15 + PWA     Next.js 15           Next.js 15            │
└────────────┬──────────────────┬──────────────────┬──────────────┘
             │                  │                  │
             │       REST API (JSON)               │
             ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER                                  │
│              apps/backend — Express + TypeScript                 │
│              api.weareasur.in  (Railway)                         │
│                                                                  │
│  /auth  /products  /orders  /payments  /reviews  /vendor         │
│  /admin /inventory /loyalty /gift-cards /newsletter /ai          │
│  /coupons /notifications /abandoned-cart /articles /track        │
└───────┬──────────────────────────────────────────────┬──────────┘
        │                                              │
        ▼                                              ▼
┌───────────────────┐                    ┌─────────────────────────┐
│   MongoDB Atlas   │                    │  Third-Party Services    │
│                   │                    │                          │
│  Products         │                    │  Firebase Auth           │
│  Orders           │                    │  Razorpay (payments)     │
│  Customers        │                    │  Cloudflare R2 (media)   │
│  Reviews          │                    │  Resend (emails)         │
│  Inventory        │                    │  Anthropic Claude (AI)   │
│  Loyalty          │                    │  India Post API (PIN)    │
│  GiftCards        │                    │  Sentry (errors)         │
│  Articles / Drops │                    │                          │
│  AuditLog         │                    └─────────────────────────┘
└───────────────────┘
```

### Shared Packages

| Package | Purpose |
|---|---|
| `packages/types` | Shared TypeScript types — **also duplicated in** `apps/backend/src/shared/types.ts` |
| `packages/constants` | Courier URLs, product fits, India states — **also duplicated in** `apps/backend/src/shared/validations.ts` |
| `packages/utils` | `formatCurrency`, date helpers |

> ⚠️ **Critical rule:** Any change to types or constants must be made in BOTH `packages/` AND the backend local copy.

---

## 2. Module Domains & Team Assignment

The system is split into **6 domains**. Assign one domain per engineer or pair.

---

### Domain A — Catalog & Discovery
**Owner: _______________**

Everything a customer uses to find products.

| Module | Key Files |
|---|---|
| Product catalog | `apps/backend/src/controllers/product.controller.ts` · `apps/web/app/products/` |
| Collections | `apps/backend/src/routes/products.routes.ts` · `apps/web/app/collections/` |
| Search & autocomplete | `apps/backend/src/controllers/product.controller.ts` (suggest endpoint) · `apps/web/components/site-header.tsx` |
| Editorial (articles) | `apps/backend/src/models/article.model.ts` · `apps/web/app/journal/` · `apps/admin/app/articles/` |
| Drops (countdown + access gate) | `apps/web/app/drops/[slug]/` · `apps/web/components/access-gate.tsx` |
| Wishlist | `apps/backend/src/routes/wishlist.routes.ts` · `apps/web/store/wishlist-store.ts` · `apps/web/app/wishlist/` |
| Compare | `apps/web/store/compare-store.ts` · `apps/web/app/compare/` · `apps/web/components/compare-bar.tsx` |
| PDP (product detail) | `apps/web/app/products/[slug]/product-detail-client.tsx` |
| Live stock SSE | `apps/web/lib/use-stock-stream.ts` · `apps/backend/src/routes/products.routes.ts` (SSE endpoint) |

**Scaling levers:** pre-order products, drop access codes, editorial content driving organic SEO.

---

### Domain B — Commerce & Checkout
**Owner: _______________**

Everything between "Add to cart" and "Order confirmed".

| Module | Key Files |
|---|---|
| Cart store | `apps/web/store/cart-store.ts` · `apps/web/app/cart/page.tsx` |
| Checkout flow | `apps/web/app/checkout/page.tsx` (3-step: Address → Review → Payment) |
| Razorpay integration | `apps/web/lib/razorpay.ts` · `apps/backend/src/controllers/payment.controller.ts` |
| Coupons & discounts | `apps/backend/src/models/coupon.model.ts` · `apps/admin/app/coupons/` |
| Gift cards | `apps/backend/src/models/gift-card.model.ts` · `apps/web/app/gift-cards/` · `apps/admin/app/gift-cards/` |
| Loyalty points & referral | `apps/backend/src/models/loyalty.model.ts` · `apps/web/store/loyalty-store.ts` · `apps/web/app/account/loyalty/` |
| Site config (free shipping threshold, GST rate) | `apps/backend/src/models/site-config.model.ts` · `apps/admin/app/settings/` |
| Pincode autofill | In `apps/web/app/checkout/page.tsx` — India Post API |

**Scaling levers:** flash sales (new coupon type), tiered loyalty (already 3 tiers), gift card bulk purchase, B2B pricing.

---

### Domain C — Order Lifecycle
**Owner: _______________**

From payment captured to package delivered and potentially returned.

| Module | Key Files |
|---|---|
| Order model & service | `apps/backend/src/models/order.model.ts` · `apps/backend/src/services/order.service.ts` |
| Order status machine | `apps/backend/src/controllers/admin.controller.ts` (bulk-status) |
| Vendor task management | `apps/backend/src/models/vendor-task.model.ts` · `apps/vendor/` (full app) |
| Inventory (atomic stock) | `apps/backend/src/controllers/inventory.controller.ts` · `apps/admin/app/inventory/` |
| Shipping & tracking | `packages/constants/src/index.ts` (COURIER_TRACKING_URLS) · `apps/web/app/track/page.tsx` |
| Returns & refunds | `apps/backend/src/services/return.service.ts` · `apps/web/app/orders/[id]/page.tsx` |
| GST PDF invoice | `apps/backend/src/controllers/admin.controller.ts` (invoice endpoint, pdfkit) |
| Order confirmation page | `apps/web/app/orders/[id]/confirmation/page.tsx` |
| Order timeline (web) | `apps/web/app/orders/[id]/page.tsx` (OrderTimeline component) |

**Scaling levers:** bulk order actions (already built), vendor performance reports, auto-fulfillment hooks, shiprocket integration (explicitly excluded so far).

---

### Domain D — Customer & Marketing
**Owner: _______________**

Acquiring, retaining, and re-engaging customers.

| Module | Key Files |
|---|---|
| Firebase Auth (web) | `apps/web/lib/firebase.ts` · `apps/web/store/auth-store.ts` · `apps/web/app/auth/page.tsx` |
| Customer profile & addresses | `apps/web/app/account/` · `apps/backend/src/routes/auth.routes.ts` |
| Reviews v2 (photo + verified) | `apps/backend/src/models/review.model.ts` · `apps/web/app/products/[slug]/product-detail-client.tsx` (ReviewsSection) |
| Review request cron | `apps/backend/src/services/review-request.cron.ts` |
| Newsletter (double opt-in) | `apps/backend/src/repositories/newsletter-subscriber.repository.ts` · `apps/web/components/exit-intent-popup.tsx` |
| Abandoned cart recovery | `apps/backend/src/services/order.service.ts` (cron, 1h + 24h emails) |
| Email templates | `apps/backend/src/services/email-templates/` (6 templates) |
| Notifications (bell + polling) | `apps/backend/src/models/notification.model.ts` · `apps/web/store/notification-store.ts` |
| AI size recommendation | `apps/backend/src/routes/ai.routes.ts` · PDP AiSizeRec component |
| Visual search (Claude Vision) | `apps/web/app/products/products-client.tsx` (visual search panel) |
| Customer CRM | `apps/admin/app/customers/` · `apps/backend/src/controllers/admin.controller.ts` |
| Email campaigns | `apps/backend/src/services/email.service.ts` (sendCampaign) |

**Scaling levers:** email segmentation (already by tier/segment), exit-intent popup, referral codes (already built), SMS via Resend, push notifications via web push.

---

### Domain E — Admin & Operations
**Owner: _______________**

Internal tooling for the ASUR team.

| Module | Key Files |
|---|---|
| Admin auth (ADMIN_SECRET bearer) | `apps/admin/components/admin-sidebar.tsx` · `apps/backend/src/middleware/adminOnly.ts` |
| Dashboard & analytics | `apps/admin/app/page.tsx` (KPIs, Recharts chart, top products, CSV export) |
| Order kanban | `apps/admin/app/orders/page.tsx` (HTML5 DnD, SSE real-time feed) |
| Product management | `apps/admin/app/products/` |
| Inventory panel | `apps/admin/app/inventory/page.tsx` |
| Returns queue | `apps/admin/app/returns/page.tsx` |
| Newsletter subscribers | `apps/admin/app/newsletter/page.tsx` |
| RBAC (requirePermission middleware) | `apps/backend/src/middleware/requirePermission.ts` |
| Audit log | `apps/backend/src/models/audit-log.model.ts` · `apps/admin/app/settings/audit-log/page.tsx` |
| Site settings (announcement bar, shipping config) | `apps/admin/app/settings/page.tsx` |
| Cmd+K command palette | `apps/admin/components/command-palette.tsx` |
| AI description generator | `apps/admin/app/products/[id]/page.tsx` (Generate with AI button) |

**Scaling levers:** RBAC already built — add roles per team member, audit log already live, SSE real-time feed for live ops.

---

### Domain F — Platform & Infrastructure
**Owner: _______________**

Security, reliability, delivery pipeline.

| Module | Key Files |
|---|---|
| Rate limiting | `apps/backend/src/app.ts` (express-rate-limit) |
| Security headers | `apps/backend/src/app.ts` (Helmet + CSP) |
| Pino structured logging | `apps/backend/src/lib/logger.ts` |
| Sentry (backend + web) | Backend `app.ts` · `apps/web/instrumentation.ts` |
| Health check | `apps/backend/src/routes/health.routes.ts` |
| CI/CD (GitHub Actions) | `.github/workflows/ci.yml` |
| Railway deploy (backend) | `railway.toml` · `docs/handover/../railway-setup.md` |
| Vercel deploy (web/admin/vendor) | `vercel.json` · `apps/*/vercel.json` |
| PWA (service worker, manifest) | `apps/web/public/manifest.json` · `apps/web/public/sw.js` |
| Bottom tab bar (mobile) | `apps/web/components/bottom-tab-bar.tsx` |
| Pull-to-refresh | `apps/web/app/orders/page.tsx` |

---

## 3. Repo Structure

```
asur/
├── apps/
│   ├── web/                  # Customer storefront (Next.js)
│   │   ├── app/              # Pages (App Router)
│   │   ├── components/       # Shared UI components
│   │   ├── store/            # Zustand stores (cart, auth, wishlist, loyalty…)
│   │   └── lib/              # API client, firebase, analytics, razorpay
│   ├── backend/              # Express API
│   │   └── src/
│   │       ├── controllers/  # Route handlers
│   │       ├── models/       # Mongoose schemas
│   │       ├── repositories/ # Data access layer
│   │       ├── services/     # Business logic + cron jobs
│   │       ├── routes/       # Express routers
│   │       ├── middleware/   # Auth, rate-limit, RBAC, logging
│   │       └── shared/       # Local copy of types + constants
│   ├── admin/                # Admin panel (Next.js)
│   │   ├── app/              # Pages
│   │   └── components/       # Sidebar, command palette, variant editor
│   └── vendor/               # Vendor task portal (Next.js)
├── packages/
│   ├── types/                # Shared TS types
│   ├── constants/            # Courier URLs, fits, states, APP_NAME
│   └── utils/                # formatCurrency, date helpers
├── docs/
│   ├── handover/             # ← You are here
│   └── railway-setup.md      # Single authoritative deploy guide
└── .github/workflows/ci.yml  # GitHub Actions CI
```

---

## 4. Key Environment Variables

| Variable | Used In | Purpose |
|---|---|---|
| `MONGODB_URI` | backend | Atlas connection string |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | backend | Server-side Firebase admin |
| `JWT_SECRET` | backend | Session token signing |
| `ADMIN_SECRET` | backend | Admin panel bearer token |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | backend | Payment processing |
| `RESEND_API_KEY` | backend | Transactional emails |
| `ANTHROPIC_API_KEY` | backend | AI description gen + size rec |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY` / `R2_SECRET_KEY` / `R2_BUCKET` | backend | Media uploads (`asur-assets`) |
| `R2_PUBLIC_URL` | backend + web | CDN base URL for images |
| `NEXT_PUBLIC_API_URL` | web + admin + vendor | Backend base URL |
| `NEXT_PUBLIC_RAZORPAY_KEY` | web | Client-side Razorpay key |
| `NEXT_PUBLIC_FIREBASE_*` | web | Firebase web SDK config |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | web | WhatsApp support link (optional) |
| `SENTRY_DSN` | backend + web | Error tracking |

> Full deploy guide: `docs/railway-setup.md`

---

## 5. Critical Rules for All Engineers

1. **Never auto-commit** — always get review before pushing to `main`
2. **Dual-write types/constants** — `packages/` AND `apps/backend/src/shared/` — they are not auto-synced
3. **Build before merge** — `pnpm -C apps/web build` + `pnpm -C apps/backend build` must pass
4. **Admin auth = ADMIN_SECRET only** — no Firebase session on admin panel
5. **Razorpay amounts in paise** — always `Math.round(rupees * 100)`
6. **Stock ops must be atomic** — use `$inc` with `$gte: 0` guard, never read-then-write
7. **Email templates in** `apps/backend/src/services/email-templates/` — keep HTML escaped
8. **RBAC middleware** — new admin routes must call `requirePermission("permission:name")`
