# ASUR — Vercel Deployment Guide

Three Next.js apps deploy to Vercel from the same GitHub monorepo as separate projects.

| Vercel Project | Root Directory | Domain |
|---|---|---|
| `asur-web` | `apps/web` | `asur.in`, `www.asur.in` |
| `asur-admin` | `apps/admin` | `admin.asur.in` |
| `asur-vendor` | `apps/vendor` | `vendor.asur.in` |

> **Before you start:** Deploy the backend to Railway first and note its public URL (`https://api.asur.in`). All three apps need `NEXT_PUBLIC_API_URL` pointing to it.

---

## Step 1 — Create the Vercel projects

Repeat these steps **three times** — once for each app.

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Click **Import Git Repository** and select the ASUR monorepo.
3. Under **Configure Project**, expand **Root Directory** and set it:

   | App | Root Directory |
   |---|---|
   | Web storefront | `apps/web` |
   | Admin dashboard | `apps/admin` |
   | Vendor app | `apps/vendor` |

4. Leave **Framework Preset** as `Next.js` — Vercel auto-detects it.
5. Leave **Build & Output Settings** alone — they are already set in each app's `vercel.json`.
6. Do **not** deploy yet. Add environment variables first (Step 2).

---

## Step 2 — Set environment variables

Go to **Project → Settings → Environment Variables** for each project and add the variables below. Set **Environment** to `Production`, `Preview`, and `Development` for all of them unless noted otherwise.

### asur-web (storefront)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.asur.in` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `asur-7e32a.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `asur-7e32a` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `asur-7e32a.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `694940758108` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:694940758108:web:b2587b544be5b0bd513699` |
| `NEXT_PUBLIC_RAZORPAY_KEY` | `rzp_live_...` — Razorpay dashboard → Settings → API Keys → Key ID |
| `NEXT_PUBLIC_ADMIN_URL` | `https://admin.asur.in` |
| `NEXT_PUBLIC_SENTRY_DSN` | _(optional)_ sentry.io → Project → Settings → Client Keys → DSN |

### asur-admin (admin dashboard)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.asur.in` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `asur-7e32a.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `asur-7e32a` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `asur-7e32a.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `694940758108` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:694940758108:web:b2587b544be5b0bd513699` |
| `NEXT_PUBLIC_SENTRY_DSN` | _(optional)_ |

> **Admin login:** the admin panel password is `ADMIN_SECRET` — that variable lives on the **backend** (Railway), not here. You just type it on the login screen at `admin.asur.in`.

### asur-vendor (vendor fulfilment app)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.asur.in` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `asur-7e32a.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `asur-7e32a` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `asur-7e32a.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `694940758108` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:694940758108:web:b2587b544be5b0bd513699` |
| `NEXT_PUBLIC_SENTRY_DSN` | _(optional)_ |

---

## Step 3 — Deploy

Once all environment variables are saved:

1. Go to **Project → Deployments → Redeploy** (or just push to `main` — Vercel auto-deploys on every push).
2. Watch the build log. A successful build looks like:

```
Running build in Washington, D.C., USA (East) – iad1
...
cd ../.. && pnpm --filter @asur/constants ... build && pnpm -C apps/web build
...
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
```

3. Vercel gives you a `.vercel.app` preview URL straight away. Test it before adding the custom domain.

---

## Step 4 — Add custom domains

In each project → **Settings → Domains** → **Add**.

| Project | Domain to add |
|---|---|
| `asur-web` | `asur.in` then `www.asur.in` |
| `asur-admin` | `admin.asur.in` |
| `asur-vendor` | `vendor.asur.in` |

Vercel will show you a DNS record to add (usually a CNAME or A record). Add it in your domain registrar and Vercel auto-provisions the SSL certificate within minutes.

---

## Step 5 — Verify

| Check | How |
|---|---|
| Storefront loads | Open `https://asur.in` |
| Products visible | Browse to `/products` — should fetch from `api.asur.in` |
| Auth works | Sign in with Google or email |
| Admin panel | Open `https://admin.asur.in`, type the `ADMIN_SECRET` password |
| Vendor app | Open `https://vendor.asur.in`, sign in as a vendor |

---

## Redeployments & rollbacks

- **Auto-deploy:** every push to `main` triggers a new deployment on all three projects automatically.
- **Preview deploys:** every PR gets its own `.vercel.app` URL — useful for testing before merging.
- **Rollback:** Vercel → Project → Deployments → find a previous deployment → **Promote to Production**.

---

## Environment variables for local dev

`.env.local` files are **never read by Vercel** — they are local-only. When running `pnpm dev`, the apps read from:

| App | Local env file |
|---|---|
| `apps/web` | `apps/web/.env.local` |
| `apps/admin` | `apps/admin/.env.local` |
| `apps/vendor` | `apps/vendor/.env.local` |

Fill in these files with the same values as the Vercel dashboard to keep parity between local and production.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails: `Cannot find module '@asur/types'` | The shared-package build step in `vercel.json` didn't run. Check that Root Directory is set to `apps/web` (not repo root) in the Vercel project settings. |
| `NEXT_PUBLIC_API_URL` points to localhost in production | Env var not set in Vercel dashboard — it's only in `.env.local`. Add it under Project → Settings → Environment Variables. |
| Firebase auth errors in production | Firebase console → Authentication → Settings → **Authorized domains** — add `asur.in`, `admin.asur.in`, `vendor.asur.in`. |
| CORS errors from the backend | The backend's `ALLOWED_ORIGINS` in `apps/backend/src/app.ts` must include the Vercel production URLs. They're already there for `asur.in`, `admin.asur.in`, `vendor.asur.in`. |
