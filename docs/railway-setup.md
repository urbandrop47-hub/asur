# ASUR — Deployment Guide

| App | Platform | URL |
|-----|----------|-----|
| `apps/backend` | Railway | `https://api.asur.in` |
| `apps/web` | Vercel | `https://asur.in` |
| `apps/admin` | Vercel | `https://admin.asur.in` |
| `apps/vendor` | Vercel | `https://vendor.asur.in` |

---

## Part 1 — Backend on Railway

### 1. Create a Railway project

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
2. Select the ASUR monorepo.
3. Railway will create one service. Set its **Root Directory** to `apps/backend`.
4. Railway auto-detects `apps/backend/railway.toml` and `apps/backend/nixpacks.toml`.

### 2. Set environment variables

In Railway → Service → **Variables**, add every variable below.

```
NODE_ENV=production
PORT=4000
MONGODB_URI=<Atlas connection string>
ADMIN_SECRET=<strong password — typed on the admin panel login screen>
FIREBASE_PROJECT_ID=asur-7e32a
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@asur-7e32a.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=<paste the full private key including BEGIN/END lines>
RAZORPAY_KEY=<from Razorpay dashboard → Settings → API Keys>
RAZORPAY_SECRET=<from Razorpay dashboard → Settings → API Keys>
RESEND_API_KEY=<from resend.com → API Keys>
ADMIN_EMAIL=ridamkansal@gmail.com
R2_ACCESS_KEY=<Cloudflare → R2 → Manage R2 API Tokens>
R2_SECRET_KEY=<Cloudflare → R2 → Manage R2 API Tokens>
R2_BUCKET=<your bucket name>
R2_ACCOUNT_ID=<Cloudflare dashboard → right sidebar>
R2_PUBLIC_URL=<public URL of the bucket, e.g. https://pub-xxxx.r2.dev>
SENTRY_DSN=<optional>
```

### 3. Add a custom domain

Railway → Service → Settings → Domains → Add `api.asur.in`.

### 4. Health check

Railway uses `GET /health` as the readiness probe (configured in `apps/backend/railway.toml`).
The deploy only goes live once `/health` returns 200 — zero-downtime is automatic.

### 5. Verify the deploy

```bash
curl https://api.asur.in/health
```

Expected response:
```json
{ "success": true, "data": { "status": "ok", "database": { "status": "connected" } } }
```

### 6. Rollback

Railway → Service → Deployments → click any previous deploy → **Redeploy**.

---

## Part 2 — Web, Admin, Vendor on Vercel

Create **three separate Vercel projects** from the same GitHub repo — one per app.

### Step-by-step (repeat for each app)

1. Go to [vercel.com](https://vercel.com) → New Project → Import the ASUR repo.
2. Set **Root Directory** to the app folder:

| Vercel project | Root Directory |
|---|---|
| `asur-web` | `apps/web` |
| `asur-admin` | `apps/admin` |
| `asur-vendor` | `apps/vendor` |

3. Vercel reads the `vercel.json` in each root directory — the build command already handles building the shared packages first. No extra config needed.

4. Set **Environment Variables** in Vercel → Project → Settings → Environment Variables.

### Environment variables — asur-web

```
NEXT_PUBLIC_API_URL=https://api.asur.in
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=asur-7e32a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=asur-7e32a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=asur-7e32a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=694940758108
NEXT_PUBLIC_FIREBASE_APP_ID=1:694940758108:web:b2587b544be5b0bd513699
NEXT_PUBLIC_RAZORPAY_KEY=<rzp_live_... from Razorpay dashboard>
NEXT_PUBLIC_ADMIN_URL=https://admin.asur.in
NEXT_PUBLIC_SENTRY_DSN=<optional>
```

### Environment variables — asur-admin

```
NEXT_PUBLIC_API_URL=https://api.asur.in
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=asur-7e32a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=asur-7e32a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=asur-7e32a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=694940758108
NEXT_PUBLIC_FIREBASE_APP_ID=1:694940758108:web:b2587b544be5b0bd513699
NEXT_PUBLIC_SENTRY_DSN=<optional>
```

### Environment variables — asur-vendor

```
NEXT_PUBLIC_API_URL=https://api.asur.in
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC5ghQgOV_Z3Ec3XzvIJ9I01LYtcRI32m4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=asur-7e32a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=asur-7e32a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=asur-7e32a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=694940758108
NEXT_PUBLIC_FIREBASE_APP_ID=1:694940758108:web:b2587b544be5b0bd513699
NEXT_PUBLIC_SENTRY_DSN=<optional>
```

### 5. Add custom domains

In each Vercel project → Settings → Domains:

| Project | Domain |
|---|---|
| `asur-web` | `asur.in`, `www.asur.in` |
| `asur-admin` | `admin.asur.in` |
| `asur-vendor` | `vendor.asur.in` |

### Note on `.env.local`

`.env.local` files are **local development only** — Vercel never reads them. Everything above must be entered in the Vercel dashboard. The local files are just for running `pnpm dev` on your machine.

---

## Part 3 — GitHub Actions

The CI pipeline (`.github/workflows/ci.yml`) runs on every PR automatically — no setup needed beyond pushing to GitHub.

For Railway preview environments, add `RAILWAY_TOKEN` as a GitHub repo secret:
GitHub → repo → Settings → Secrets → Actions → New repository secret.
