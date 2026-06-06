# ASUR — Business Scaling Plan

> This document maps each business growth lever to the module that enables it and the engineering effort required.  
> Columns: **Lever** — what the business outcome is · **Module** — domain owner · **Effort** — S = 1 sprint, M = 2–3 sprints, L = 4+ sprints

---

## Phase 1 — Go Live & Baseline (Weeks 1–4)

These must be done before any growth work.

| Task | Owner | Status |
|---|---|---|
| Deploy backend to Railway | Domain F | See `docs/railway-setup.md` |
| Configure Resend API key (emails won't work without it) | Domain F | `RESEND_API_KEY` env var |
| Configure R2 bucket + keys (media uploads broken without it) | Domain F | `R2_ACCESS_KEY`, `R2_SECRET_KEY` |
| Configure Razorpay live keys | Domain B | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Configure Anthropic API key (AI features return 503 without it) | Domain D | `ANTHROPIC_API_KEY` |
| Add ADMIN_SECRET to Railway + NEXT_PUBLIC env to Vercel | Domain F | Follow railway-setup.md |
| Seed first product + collection via admin panel | Domain A | Admin panel → Products → New |
| Test full purchase flow end-to-end (test mode Razorpay) | Domain B | Checkout → payment → confirmation |

---

## Phase 2 — Revenue Foundation (Months 1–2)

Get the first 1,000 orders. Focus: conversion rate, trust signals, email capture.

### 2A — Storefront Trust & Polish
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| Review count on collection cards | Show star rating on ProductCard | A | S |
| Faster PDP load | Next.js Image priority + AVIF already enabled | A | done |
| Mobile checkout UX | Sticky CTA, pincode autofill — already built | B | done |
| Social proof on homepage | Testimonials section — already built | A | done |
| Size chart completeness | Fill in `size-charts` collection for each category | A | S |

### 2B — Email Capture & Re-engagement
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| Exit-intent popup | Already built — configure timing/copy in env | D | done |
| Welcome email on signup | Add email template + trigger on auth.controller | D | S |
| Review request email | Already built — fires 7d post-delivery | D | done |
| Abandoned cart recovery | Already built — 1h + 24h with 5% coupon | D | done |
| Newsletter unsubscribe page | Already built | D | done |

### 2C — Promotions & Discounts
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| First-order discount | Create coupon with `usageLimit: 1, perCustomerLimit: 1` | B | done (coupon model) |
| Flash sale coupon | Create time-limited `percent` coupon in admin | B | done |
| Referral program | Already built — referral codes + bonus points | B/D | done |
| Gift cards | Already built — purchasable and redeemable | B | done |

---

## Phase 3 — Retention & LTV (Months 2–4)

Turn buyers into repeat customers. CAC paid once — maximize LTV.

### 3A — Loyalty Programme
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| Loyalty tiers live | Bronze / Silver / Gold already built | B | done |
| Points earn on all orders | Already earns 1pt/₹10 | B | done |
| Tier-exclusive coupons | New coupon field: `minTier: "gold"` — 1 sprint to add | B | S |
| Birthday discount email | Add `dateOfBirth` to Customer + scheduled email cron | D | S |
| Points expiry (12 months) | Add `expiresAt` field to LoyaltyTransaction | B | S |

### 3B — Post-Purchase Engagement
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| Review incentive (pts for review) | Award loyalty points on approved review | C/D | S |
| "Buy it again" on account page | Query most purchased products per customer | D | S |
| Recently viewed on homepage | Already built (localStorage) | A | done |
| Related products on PDP | Already built (tag/collection similarity) | A | done |
| Wishlist share via WhatsApp | Already built | A | done |

### 3C — Customer Segmentation
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| CRM customer list + profiles | Already built (Domain E) | E | done |
| Email campaign to segment | Already built — all/active/lapsed/top/tier | D/E | done |
| Lapsed customer win-back email | Add scheduled cron — 60-day no-purchase trigger | D | S |
| VIP (Gold) early drop access | Use drop access codes for Gold tier | A | S |

---

## Phase 4 — Scale & Diversify (Months 4–8)

Grow AOV, SKU count, and geographic reach.

### 4A — Catalog Expansion
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| Multiple vendors / suppliers | Vendor portal already built — add more vendor accounts | C | S |
| Drop strategy (limited releases) | Drop model already built — plan cadence | A | done |
| Pre-order collections | Pre-order product status already built | A | done |
| Bulk CSV product import | Inventory CSV upload already built | C | done |
| Product bundles | New `bundle` product type + bundle pricing | A | M |

### 4B — Checkout & Payment Expansion
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| COD (Cash on Delivery) | New payment method type in order flow | B | S |
| UPI autopay / subscriptions | Razorpay subscription API | B | M |
| EMI options | Razorpay EMI — configure in checkout options | B | S |
| B2B / Wholesale pricing | `customerType: "b2b"` + wholesale price tier | B | M |
| Multi-currency display (INR only right now) | Add `displayCurrency` to SiteConfig | B/F | M |

### 4C — Operations Scaling
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| Shiprocket integration | Auto-create shipments on "packed" status | C | M |
| Auto-fulfillment webhook | Carrier delivers → update status via webhook | C | M |
| Bulk GST invoice download | Already built — download per order | E | done |
| Vendor performance SLAs | Alert admin if task > N hours unfulfilled | C/E | S |
| Low-stock auto-reorder alerts | Threshold config per variant in inventory panel | C | S |

---

## Phase 5 — Platform Maturity (Months 6–12)

Infrastructure that supports 10× transaction volume.

### 5A — Performance
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| MongoDB indexes audit | Add compound indexes on Order, Product queries | F | S |
| Redis cache for product catalog | Cache `/api/v1/products` responses in Redis | F | M |
| Image CDN (already R2 + AVIF) | Done | F | done |
| DB connection pooling | Mongoose `poolSize` config in `app.ts` | F | S |
| k6 load test baseline | k6 script already in `/k6` — run and record baseline | F | S |

### 5B — Reliability
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| Sentry alerts configured | Already instrumented — configure alert rules in Sentry dashboard | F | done |
| Uptime monitoring | Add Railway health check URL to UptimeRobot or Better Uptime | F | S |
| DB backup schedule | Configure Atlas scheduled backup (Atlas UI) | F | S |
| Idempotency on payments | `idempotencyKey` already on Razorpay verify — verify no gaps | B | S |
| Staging environment | Duplicate Railway service + Vercel preview envs | F | M |

### 5C — Compliance & Legal
| Lever | What to do | Domain | Effort |
|---|---|---|---|
| Privacy policy / T&Cs | Pages already at `/privacy` `/terms` `/returns` `/faq` | D | done |
| GDPR data export + deletion | Already built — `/account/notifications` + export endpoint | D | done |
| Cookie consent | Already built — banner + per-category toggle | D | done |
| GST filing data export | Already in analytics CSV export + invoice PDF | E | done |

---

## Sprint Backlog (Next Planned Features)

These were planned but not yet built. Assign as team bandwidth allows.

| Feature | Domain | Effort | Notes |
|---|---|---|---|
| COD payment method | B | S | High demand in Indian market |
| Shiprocket integration | C | M | Auto-label on packed status |
| Birthday / anniversary email | D | S | Add dob field to Customer |
| Tier-exclusive coupons | B | S | `minTier` field on Coupon model |
| B2B wholesale pricing | B | M | `customerType` + wholesale rate |
| Product bundles | A | M | e.g. "Buy 2 get 10% off" |
| Multi-currency display | B/F | M | INR stays base, display in USD/GBP |
| Push notifications (web push) | D | M | Service worker already has shell |
| Redis caching layer | F | M | Backend currently hits DB every request |
| Mobile app (React Native) | All | L | API is already REST — reuse backend |
| Subscription / repeat purchase | B | L | Razorpay subscriptions API |

---

## Module Dependency Map

Understanding which modules must be stable before others can scale.

```
Authentication ──────────────────────────────────────────────────────┐
                                                                      │
Product Catalog ──→ Inventory ──→ Order Lifecycle ──→ Returns        │
       │                │                │                            │
       ▼                ▼                ▼                            ▼
  Search/Drops    Stock Alerts    Vendor Tasks           Customer Profile
       │                                 │                    │
       ▼                                 ▼                    ▼
  Cart ──────────────────────────→ Checkout ──→ Payments   Loyalty
                                      │              │         │
                                      ▼              ▼         ▼
                               Email Service    GST Invoice   Referral
                                      │
                                      ▼
                             Abandoned Cart Recovery
                             Review Requests
                             Shipping Updates
```

**Rule:** Never scale a downstream module if its upstream is unstable. For example, don't run email campaigns (Domain D) if the Order Lifecycle (Domain C) is not reliable — mismatched state leads to wrong emails.

---

## KPIs to Track Per Domain

| Domain | Primary KPI | Secondary KPI |
|---|---|---|
| A — Catalog | PDP → ATC conversion rate | Search result click-through |
| B — Commerce | Checkout → payment success rate | AOV (Average Order Value) |
| C — Orders | Avg fulfillment time (paid → shipped) | Return rate |
| D — Marketing | Email open rate · Referral conversion | Newsletter list growth |
| E — Admin | GMV per week (already on dashboard) | Avg order processing time |
| F — Platform | API p99 latency · Error rate (Sentry) | Deploy frequency |

All Domain E KPIs are already on the admin dashboard (`/` route in the admin panel).
