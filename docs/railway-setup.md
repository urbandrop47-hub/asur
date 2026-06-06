# ASUR — Production Deployment Guide

> **Last updated:** Sprint 40 (S40)
>
> This is the single authoritative guide. `docs/production-setup.md` and `docs/vercel-deploy.md` are older drafts — ignore them.

---

## Architecture at a glance

| Service | Platform | Live URL |
|---|---|---|
| Express API (`apps/backend`) | Railway | `https://api.weareasur.in` _(set domain in Railway)_ |
| Customer storefront (`apps/web`) | Vercel → project `asur-web` | `https://weareasur.in` |
| Admin panel (`apps/admin`) | Vercel → project `asur-admin` | `https://asur-admin-delta.vercel.app` _(or custom domain)_ |
| Vendor app (`apps/vendor`) | Vercel → project `asur-vendor` | `https://asur-vendor.vercel.app` _(or custom domain)_ |

MongoDB Atlas, Firebase Auth, and Cloudflare R2 are shared across all four services.

> **Razorpay is excluded from this guide** — configure it separately when ready. The checkout uses mock mode when `RAZORPAY_KEY` is absent.

---

## Status: what's already configured

The following credentials are **already in `.env` / `.env.local`** and just need to be pasted into Railway / Vercel:

| Credential | Status |
|---|---|
| MongoDB Atlas URI | ✅ configured |
| Firebase service account (backend) | ✅ configured |
| Firebase web SDK config (frontend) | ✅ configured |
| JWT secret + Admin secret | ✅ configured |
| Admin email | ✅ configured |
| R2 account ID + public URL | ✅ configured |
| **R2 access key / secret / bucket** | ❌ still needed |
| **Resend API key** | ❌ still needed (emails won't send without it) |
| **Anthropic API key** | ❌ still needed (AI features return 503 without it) |
| Razorpay | ⏭ skipped for now |

---

## Part 1 — Backend on Railway

Railway runs the Express API. One service, root directory `apps/backend`.

### 1.1 — If not created yet

1. Go to [railway.app](https://railway.app) → **New project** → **Deploy from GitHub repo** → select the ASUR monorepo.
2. In the service settings:
   - **Root Directory**: `apps/backend`
   - Railway auto-detects `apps/backend/railway.toml` — no manual build/start command needed.
3. Set a custom domain: Service → Settings → Domains → add `api.weareasur.in` (or use the Railway-generated URL for now).

### 1.2 — Environment variables (Railway → Service → Variables)

Paste these in exactly. Everything in the `✅ ready` column can be copied from `.env` right now.

```
# ── Core ─────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=4000

# ── Database ─────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://urbandrop47_db_user:H0dQnaqrwIJRJKdY@asur.ipjocmb.mongodb.net/asur?appName=asur

# ── Auth ─────────────────────────────────────────────────────────────────
JWT_SECRET=base64:vpDa9+bxfszqYhuLKdEV2Wb3RjnNIHzNRkN93eZEiMw=
ADMIN_SECRET=WE_ARE@ASUR

# ── Firebase service account ──────────────────────────────────────────────
FIREBASE_PROJECT_ID=asur-7e32a
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@asur-7e32a.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC895kn0DLx0eLk\nUTkCFfYcPezSIynwbi9fFMGjyOJiO/yyiciDf3TRgvAkPDtGkHPD3zwzVZTaKE6/\nU2BvkLf4QtEXAB1Jd4Ka1JYsopmHLK/xhEsXeLFSH6vwTF3ybmYSVZ9MrlCicfEj\nsW3N22PBRcPfyj/NHEjf4aHJ31HbnPOf+yfleh431mMMgusX6KLHyxWICBte7I9h\nNcrey3s6eg9bMaOu3VOUlObqKr1qDpwUI1Laj9Mc8hycolegMqxvj2DJISDgUTOb\nA9/EnrREuhnROGufng8RZiCcvDySwMRhg+0I+0uFvXx5Ri0F2rfRrGECAsqvsxHF\nVQF4z95ZAgMBAAECggEABUYPsym/UjpeT6rooWNFhBJCWrb6g6g/kDK/GLgRgVZV\nPhJUUz8qXnJ+CzTXHqgHYw8G2hPoXJJFaFeGWHa8e6Q5u5+YMaWxMmr+ae57xGb9\n3gqoIdaPdFBH9yPad1qXZKmZEYXH4FC3vxxDiTw3M3yj88nsL+g7LGxanIyr9yoE\n2bo4XJqbki66qyE2PEMebhrxnN4rd4yFOpuMNs2bXjCUdzMgtHQFGPkhTCuon6TA\nWBAuiHq2s16MEr5uHBe0s4HlMb2qlAOPzGKD2/SPa4nMsqwqdOs0hMzGPrFtsmVh\noSTkYtZPZZfk9nRuLkLEkyiOVtoItXggwuqsJUKzhQKBgQDxvSgQYo2M0rARqxj0\nHCwFu69uHGtIDSa5Maof2wcK2J8yU2ho6bGg4BR1aGqDNeSllYDguRki2rU3vkmV\ndgPoY18PhV7JZnZ5dEPWFFhPjpepuAgEfVy5e1+H+r00ZtMHke8bxw+EnVfaZagZ\nU45yPEK/5j6fk7CRuuT9XaGr7wKBgQDIHXYATS5T+pe2UQ30iZ0p9oAwnVTV4NIv\nU7A5c8QilsUTpgGCffdF85hXAs6IZzMP/qGFxgfPLgxDchTlFVp25VWXKMPWMOlz\nMgsqg9i/HdHIoa0YddzqpoA4sJk4n/NVKV4EGn4mYQIJ4idvjuS4Fk3Ynk2tfQel\ni7TfBjTyNwKBgQCxaPIbPEjH/ePLw7bXiElil8CC3gZ55XTy2xkQsez0L9B93aq1\nvDRpbap2FAB/dTDtuM/RnOZupvXyCAv2zZrGlQ8x096hjjoKnqIeXeYF1Q9HNlFk\nAiDn2zxcDk+HQqNDXf2OdEPWPqc4F/0LQUA8ZC9UqIRzFq+x8+iUbX/2LwKBgDEl\nQxiZ29nV/jJRP6shrM5kcmD+EpqgJx5mYC4L50xTWL0VlONWSkcMpwofb1eCeMDh\n2QtAciSIe4yI1ObZ0qjGc7m20jmlM4AN9z4OuUleamnqgtcyAvpBv9WsUUTdy2XL\nzgIV+4szYcvJlcPJBRTMrXuYjR0hSqJ2aAopvRELAoGAOPjOs7t1eclKBzAhxweO\nJaQUGy2tN1B4LOwvbjENJH84uO7+HiQaStGKYx/crZdqrCM/VcpYBxGx2GTBYMiM\nOs4b+XcrcMFbN9t3vT/WjeWXCsImPahrc5XfCucxIRXWcY2h2l9Von2MGhJbqKHp\nUnLgLEPyP4/Y1egD7YxdGr4=\n-----END PRIVATE KEY-----\n"

# ── Cloudflare R2 ─────────────────────────────────────────────────────────
R2_ACCOUNT_ID=adb87e8d9e12ebfda971e8bd04272ef5
R2_PUBLIC_URL=https://pub-36a39403c92148fa9b8d677191e81c7b.r2.dev
R2_BUCKET=asur-assets
R2_ACCESS_KEY=<R2 token access key>    # ← still needed
R2_SECRET_KEY=<R2 token secret key>    # ← still needed

# ── Transactional email (Resend) ──────────────────────────────────────────
RESEND_API_KEY=<from resend.com → API Keys>   # ← still needed
ADMIN_EMAIL=ridamkansal@gmail.com

# ── AI features (Claude Haiku) — optional, leave blank to disable ─────────
# Without this key all /api/v1/ai/* routes return 503 gracefully.
ANTHROPIC_API_KEY=<sk-ant-...>                # ← still needed

# ── Razorpay — SKIPPED FOR NOW ────────────────────────────────────────────
# RAZORPAY_KEY=
# RAZORPAY_SECRET=

# ── Sentry — optional ────────────────────────────────────────────────────
# SENTRY_DSN=
```

> **FIREBASE_PRIVATE_KEY tip**: paste the full value above (already escaped with `\n` literals) into Railway's variable editor directly. Do not strip or reformat it.

### 1.3 — Verify the backend is live

```bash
# Health check
curl https://api.weareasur.in/health
# → {"success":true,"data":{"status":"ok","database":{"status":"connected"},...}}

# Products endpoint
curl https://api.weareasur.in/api/v1/products
# → {"success":true,"data":[...]}
```

If the domain isn't connected yet, use the `*.up.railway.app` URL Railway gives you.

---

## Part 2 — Logging into the admin panel

> **There is no bootstrap process, no Firebase UID needed, no database setup.**
>
> The admin panel is locked behind a single static secret: `ADMIN_SECRET`. Whoever knows the secret is the super admin. Full stop.

**How it works:**
- `ADMIN_SECRET=WE_ARE@ASUR` is already set in `.env` (paste it into Railway as-is).
- The backend checks this value on every admin request via a constant-time compare — no database, no Firebase, no role lookup.
- `ADMIN_ROLE` defaults to `SUPER_ADMIN` — all permissions are granted.

**To log in:**
1. Open the admin panel URL (`https://asur-admin-delta.vercel.app`).
2. Type `WE_ARE@ASUR` in the password field.
3. Done — you're in with full super-admin access.

**To change the password:** Update `ADMIN_SECRET` in Railway → Variables. Railway restarts the service automatically. Update the password stored in your browser's admin panel (it clears on next login attempt if wrong).

**The `SUPER_ADMIN_BOOTSTRAP_*` vars** in the env file are legacy from an older design — the `bootstrapSuperAdmin()` function is now a no-op. Leave those vars unset.

---

## Part 3 — Vercel: `asur-web` (Customer storefront)

Vercel project: **`asur-web`** · Root directory: `apps/web` · Domain: `weareasur.in`

### 3.1 — Environment variables

Go to Vercel → `asur-web` → Settings → **Environment Variables**. Set for **Production** (and optionally Preview).

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.weareasur.in` _(or your Railway URL until domain is set)_ |
| `NEXT_PUBLIC_SITE_URL` | `https://weareasur.in` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `asur-7e32a.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `asur-7e32a` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `asur-7e32a.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `694940758108` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:694940758108:web:b2587b544be5b0bd513699` |
| `R2_PUBLIC_URL` | `https://pub-36a39403c92148fa9b8d677191e81c7b.r2.dev` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://asur-admin-delta.vercel.app` |
| `NEXT_PUBLIC_RAZORPAY_KEY` | _(skip for now)_ |
| `NEXT_PUBLIC_SENTRY_DSN` | _(skip — optional)_ |

> **`R2_PUBLIC_URL` must be set on Vercel** — `next.config.mjs` reads it at **build time** to add your R2 hostname to Next.js's `images.remotePatterns`. Without it, product images from R2 will 400.
>
> **`NEXT_PUBLIC_SITE_URL` must be set** — used by `sitemap.xml`, `robots.txt`, OpenGraph, and JSON-LD schemas. Falls back to `https://weareasur.in` in code, but set it explicitly so it's correct in all environments.

### 3.2 — Deploy

After adding all variables: Vercel → `asur-web` → Deployments → click the latest → **⋯ → Redeploy**.

### 3.3 — Firebase authorized domains

Firebase Console → Build → Authentication → Settings → **Authorized domains** → Add:
- `weareasur.in`
- `www.weareasur.in`
- `asur-web.vercel.app` (Vercel preview domain)

---

## Part 4 — Vercel: `asur-admin` (Admin panel)

Vercel project: **`asur-admin`** · Root directory: `apps/admin`

### 4.1 — Environment variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.weareasur.in` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `asur-7e32a.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `asur-7e32a` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `asur-7e32a.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `694940758108` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:694940758108:web:b2587b544be5b0bd513699` |
| `R2_PUBLIC_URL` | `https://pub-36a39403c92148fa9b8d677191e81c7b.r2.dev` |
| `NEXT_PUBLIC_SENTRY_DSN` | _(skip — optional)_ |

> Admin uses Firebase auth for login. Without the Firebase vars, the login screen won't initialize.
>
> `R2_PUBLIC_URL` is needed for `next.config.mjs` to allow product images uploaded to R2 to render in the admin panel.

### 4.2 — Deploy

Vercel → `asur-admin` → Deployments → **Redeploy** after adding vars.

### 4.3 — Firebase authorized domains

Firebase Console → Authentication → Settings → Authorized domains → Add:
- `asur-admin-delta.vercel.app`

---

## Part 5 — Vercel: `asur-vendor` (Vendor app)

Vercel project: **`asur-vendor`** · Root directory: `apps/vendor`

### 5.1 — Environment variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.weareasur.in` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `asur-7e32a.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `asur-7e32a` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `asur-7e32a.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `694940758108` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:694940758108:web:b2587b544be5b0bd513699` |
| `R2_PUBLIC_URL` | `https://pub-36a39403c92148fa9b8d677191e81c7b.r2.dev` |
| `NEXT_PUBLIC_SENTRY_DSN` | _(skip — optional)_ |

### 5.2 — Deploy

Vercel → `asur-vendor` → Deployments → **Redeploy** after adding vars.

### 5.3 — Firebase authorized domains

Firebase Console → Authentication → Settings → Authorized domains → Add:
- `asur-vendor.vercel.app`

---

## Part 6 — Cloudflare R2 (product images)

Without R2, the storefront shows gradient placeholders instead of product photos. The app is fully functional — set this up when you're ready to upload real images.

### 6.1 — Create a bucket

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**.
2. Name it `asur-assets`. Region: auto.
3. Bucket → Settings → **Public access** → Allow access.
4. Copy the **Public bucket URL** (`https://pub-xxxx.r2.dev`).

> The R2 public URL is already configured as `https://pub-36a39403c92148fa9b8d677191e81c7b.r2.dev` — this is already set. You only need to create the API token below.

### 6.2 — Create an API token

1. R2 → **Manage R2 API tokens** → **Create API token**.
2. Permissions: **Object Read & Write**, restricted to the `asur-assets` bucket.
3. Copy **Access Key ID** → `R2_ACCESS_KEY` and **Secret Access Key** → `R2_SECRET_KEY`.
4. `R2_BUCKET=asur-assets` (already set in `.env`).

Add all four R2 vars to Railway (already have `R2_ACCOUNT_ID` and `R2_PUBLIC_URL` — just need the three above).

---

## Part 7 — Resend (transactional email)

Without Resend, order confirmation emails, shipping updates, and newsletters are silently skipped. Everything else works.

1. [resend.com](https://resend.com) → Create account → **API Keys** → **Create API Key**.
2. Add the key to Railway: `RESEND_API_KEY=re_xxxx`.
3. Add and verify your sending domain in Resend → Domains → Add domain → `weareasur.in`.
   - Add the provided DNS records to your domain registrar.
   - Once verified, Resend will send from `noreply@weareasur.in`.

---

## Part 8 — AI features (Claude Haiku)

Without `ANTHROPIC_API_KEY`, the three AI endpoints return `503` gracefully. No errors — they just don't work.

1. [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create key**.
2. Add to Railway: `ANTHROPIC_API_KEY=sk-ant-xxxx`.
3. The following features activate immediately:
   - Visual search on `/products` (camera button in toolbar)
   - AI size recommendation on every PDP ("Find my size with AI")
   - AI description generator in admin product editor ("Generate with AI")

---

## Part 9 — Smoke test checklist

Run through this after each deployment to verify all layers are connected.

### Backend
```bash
curl https://api.weareasur.in/health
# → {"success":true,"data":{"status":"ok","database":{"status":"connected"}}}

curl https://api.weareasur.in/api/v1/products
# → {"success":true,"data":[...]}

curl https://api.weareasur.in/api/v1/config
# → {"success":true,"data":{...site config...}}
```

### Storefront (`weareasur.in`)
- [ ] Homepage loads (hero, announcement bar, products)
- [ ] `/products` — product grid renders
- [ ] PDP — image, size/color picker, add to cart work
- [ ] `/cart` — items persist after reload
- [ ] `/checkout` — redirects to sign in if not logged in
- [ ] Sign in with email → Firebase auth works
- [ ] Checkout step 1 (address) → step 2 (review) → Confirm & Pay button visible
- [ ] `/about`, `/journal`, `/faq` all load
- [ ] `/sitemap.xml` — returns valid XML with product URLs
- [ ] `/robots.txt` — allows crawling, references sitemap

### Admin panel
- [ ] Login page loads — shows password field
- [ ] Type `WE_ARE@ASUR` → dashboard loads (no Firebase, no bootstrap needed)
- [ ] `/products` — product list renders
- [ ] `/orders` — order list renders
- [ ] Product edit → "Generate with AI" button visible (AI feature, requires `ANTHROPIC_API_KEY`)

### Vendor app
- [ ] Login → dashboard loads
- [ ] `/tasks` — vendor task list renders

---

## Part 10 — Deploy the `ridam` branch to production

> **Important**: `main` branch is 6+ sprints behind `ridam`. All code in this guide is on `ridam`. Merge before deploying.

```bash
# From your local repo
git checkout main
git merge ridam --no-ff -m "chore: merge ridam → main (S22–S40)"
git push origin main
```

Vercel and Railway are both connected to `main` — both will auto-deploy after the push.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Products don't load on storefront | `NEXT_PUBLIC_API_URL` wrong or Railway down | Check Railway logs; verify URL has no trailing slash |
| "Firebase not initialized" error | Missing `NEXT_PUBLIC_FIREBASE_*` on Vercel | Add all 6 Firebase vars to the correct Vercel project |
| Sign-in fails — "auth/unauthorized-domain" | Vercel domain not in Firebase authorized domains | Add domain in Firebase → Auth → Settings → Authorized domains |
| Product images show broken | `R2_PUBLIC_URL` missing on Vercel | Add `R2_PUBLIC_URL` to Vercel project (needed at build time by `next.config.mjs`) |
| Admin login works but dashboard is empty | Backend CORS config doesn't allow admin domain | Check `ALLOWED_ORIGINS` in `apps/backend/src/app.ts` |
| Emails not sending | `RESEND_API_KEY` not set or domain not verified | Check Railway vars; verify domain in Resend dashboard |
| AI features return 503 | `ANTHROPIC_API_KEY` not set in Railway | Add the key; no redeploy needed (Railway injects vars live) |
| "FIREBASE_PRIVATE_KEY formatting error" | Key has actual newlines instead of `\n` literals | Paste the key exactly as shown in §1.2 — with `\n` escape sequences |
| Admin/vendor login broken — no Firebase | Firebase vars missing on admin/vendor Vercel projects | All 6 `NEXT_PUBLIC_FIREBASE_*` vars are required for all three frontends (same values) |
