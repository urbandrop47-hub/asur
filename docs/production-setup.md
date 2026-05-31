# ASUR — Production Setup Guide

Everything you need to go from a fresh repo to a fully connected, live store. Work through the sections in order — each one unlocks the next.

---

## What you're deploying

| App | URL pattern | Platform |
|---|---|---|
| Customer storefront (`apps/web`) | `asur.store` | Vercel (already set up) |
| Admin panel (`apps/admin`) | `admin.asur.store` | Vercel |
| Vendor app (`apps/vendor`) | `vendor.asur.store` | Vercel |
| Express API (`apps/backend`) | `api.asur.store` | Railway |

All four talk to the same MongoDB Atlas cluster and Firebase project. Vercel handles the three Next.js apps; Railway runs the Express backend. R2 stores product images. Razorpay handles payments.

---

## Step 1 — MongoDB Atlas

The database that persists users, products, orders, payments, and vendor tasks.

### 1.1 Create a free cluster
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → **Create account** (free tier is fine for launch).
2. **Create a cluster** → choose M0 (free), pick a region close to your users (Mumbai for India).
3. **Create a database user**: Security → Database Access → Add new database user.
   - Username: `asur-app`
   - Password: generate a strong one and save it.
   - Role: **Atlas admin** (or `readWriteAnyDatabase`).
4. **Allow network access**: Security → Network Access → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`). This is required for Railway which doesn't have a fixed IP on the free tier.

### 1.2 Get the connection string
1. Database → Connect → **Drivers** → copy the connection string.
2. Replace `<password>` with the password from 1.3.
3. It looks like:
   ```
   mongodb+srv://asur-app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Append a database name at the end:
   ```
   mongodb+srv://asur-app:<password>@cluster0.xxxxx.mongodb.net/asur?retryWrites=true&w=majority
   ```
5. Save this as `MONGODB_URI` — you'll use it in Railway.

---

## Step 2 — Firebase

Handles authentication for customers, admins, and vendors. One Firebase project services all four apps.

### 2.1 Create the project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Name it `asur-store` (or similar). Disable Google Analytics (not needed).
3. Build → **Authentication** → Get started → **Sign-in method**.
4. Enable **Email/Password** and **Google**.

### 2.2 Register the web apps
Firebase needs to know your Vercel URLs to allow auth requests from them.

1. Project settings (⚙️) → **Your apps** → Add app → **Web** (</> icon).
2. Register three apps: `ASUR Web`, `ASUR Admin`, `ASUR Vendor`.
3. For each app, add your production Vercel URL in **Authorized domains**:
   - Authentication → Settings → Authorized domains → **Add domain**
   - Add: `asur.store`, `admin.asur.store`, `vendor.asur.store`
   - Also add `localhost` (it's usually already there).

### 2.3 Get the frontend SDK config
1. Project settings → Your apps → select the **ASUR Web** app → SDK setup and config.
2. Copy the values — you'll need them as `NEXT_PUBLIC_FIREBASE_*` env vars:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### 2.4 Create a service account (for the backend)
1. Project settings → **Service accounts** tab.
2. Click **Generate new private key** → confirm → a JSON file downloads.
3. Open the JSON and extract three fields:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (the entire string including `-----BEGIN PRIVATE KEY-----` and the `\n` characters)

> **Private key formatting tip**: In Railway, paste the private key exactly as it appears in the JSON file (with literal `\n` characters). Railway handles the escaping. Do **not** strip the newlines.

---

## Step 3 — Razorpay

Handles payment orders and signature verification.

### 3.1 Create an account
1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com) → Sign up.
2. Complete KYC for live mode, or skip KYC and stay in **test mode** for now. Test mode works for the full checkout flow without any real money.

### 3.2 Generate API keys
1. Settings → **API Keys** → Generate test key (or live key when ready).
2. Copy:
   - **Key ID** → `RAZORPAY_KEY` (backend) and `NEXT_PUBLIC_RAZORPAY_KEY` (web frontend)
   - **Key Secret** → `RAZORPAY_SECRET` (backend only — never expose this)

### 3.3 Test cards
When the checkout modal opens in test mode:
- **Card**: `4111 1111 1111 1111`, any future expiry, any CVV
- **UPI**: `success@razorpay`
- **Net banking**: select any bank → proceed without real credentials

---

## Step 4 — Cloudflare R2 (optional for launch)

Stores product images. You can skip this and launch with gradient placeholders — add it when you're ready to upload real product photos.

### 4.1 Create a bucket
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**.
2. Name it `asur-products`. Choose a region close to your users.

### 4.2 Enable public access
1. Bucket → **Settings** → **Public access** → click **Allow access**.
2. Copy the **Public bucket URL** (looks like `https://pub-xxxx.r2.dev`) → `R2_PUBLIC_URL`.

### 4.3 Create an API token
1. R2 → **Manage R2 API tokens** → **Create API token**.
2. Permissions: **Object Read & Write**, restrict to your bucket.
3. Copy:
   - **Access Key ID** → `R2_ACCESS_KEY`
   - **Secret Access Key** → `R2_SECRET_KEY`
4. R2 → Overview → copy **Account ID** → `R2_ACCOUNT_ID`
5. Your bucket name → `R2_BUCKET`

---

## Step 5 — Deploy the backend to Railway

Railway is the simplest Node.js host for the Express API. The free tier is enough to start.

### 5.1 Create a Railway project
1. Go to [railway.app](https://railway.app) → **New project** → **Deploy from GitHub repo**.
2. Select the `asur` monorepo. Railway will detect the repo.
3. **Important**: Railway will try to build from the repo root. Override the settings:
   - **Root Directory**: `apps/backend`
   - **Build Command**: `pnpm install --no-frozen-lockfile && pnpm build`
   - **Start Command**: `pnpm start`
   - **Watch Paths**: `apps/backend/**`

> If Railway doesn't support root directory overrides on your plan, add a `railway.json` to the repo root (see below).

### 5.2 `railway.json` (add to repo root if needed)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/backend && pnpm install --no-frozen-lockfile && pnpm build"
  },
  "deploy": {
    "startCommand": "cd apps/backend && pnpm start",
    "healthcheckPath": "/health"
  }
}
```

### 5.3 Set environment variables in Railway
Variables → add each one:

```
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://asur-app:<password>@cluster0.xxxxx.mongodb.net/asur?retryWrites=true&w=majority
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
RAZORPAY_KEY=rzp_test_xxxx
RAZORPAY_SECRET=xxxx
R2_ACCESS_KEY=xxxx
R2_SECRET_KEY=xxxx
R2_BUCKET=asur-products
R2_ACCOUNT_ID=xxxx
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
SUPER_ADMIN_BOOTSTRAP_ENABLED=true
SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID=<your-firebase-uid>
SUPER_ADMIN_BOOTSTRAP_EMAIL=<your-email>
SUPER_ADMIN_BOOTSTRAP_NAME=<your-name>
```

> **SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID**: log into `apps/web` with your email, open the browser console and run `firebase.auth().currentUser.uid` — or find it in Firebase Console → Authentication → Users.

### 5.4 Get your Railway URL
After deployment, Railway assigns a URL like `https://asur-backend-production.up.railway.app`. Copy this — it becomes `NEXT_PUBLIC_API_URL` in every Vercel project.

### 5.5 Smoke-test the backend
```bash
curl https://your-railway-url/health
# → {"status":"ok"}

curl https://your-railway-url/api/v1/products
# → {"success":true,"data":[...seed products...]}
```

---

## Step 6 — Set environment variables on Vercel

You already have Vercel set up for `apps/web`. Now add the env vars, then add Vercel projects for admin and vendor.

### 6.1 `asur-web` — customer storefront

Vercel → Project → Settings → **Environment Variables** → add for **Production** (and Preview):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-railway-url` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | from step 2.3 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | from Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | from Firebase |
| `NEXT_PUBLIC_RAZORPAY_KEY` | `rzp_test_xxxx` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://admin.asur.store` |

After adding vars, **Redeploy** the project (Deployments → ⋯ → Redeploy).

### 6.2 `asur-admin` — admin panel

1. Vercel → New Project → import the same repo.
2. **Root Directory**: `apps/admin`
3. **Install Command**: `pnpm install --no-frozen-lockfile`
4. **Build Command**: `pnpm build`
5. Add env vars:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-railway-url` |

That's all admin needs — it uses bearer-token auth (no Firebase on the admin frontend).

6. In Vercel, set the **custom domain** to `admin.asur.store` (or whatever subdomain you use).

### 6.3 `asur-vendor` — vendor app

Same process as admin:
1. New Project → Root Directory: `apps/vendor`
2. Add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-railway-url` |

3. Set custom domain: `vendor.asur.store`

---

## Step 7 — First super admin account

This creates the admin user in MongoDB so you can log into `admin.asur.store`.

### Option A: Bootstrap (no code, works immediately)
The backend has a bootstrap mode that promotes any user to SUPER_ADMIN on first request.

1. Sign in to `asur.store` (the customer storefront) with your email.
2. Find your **Firebase UID**: Firebase Console → Authentication → Users → click your account → copy the **UID**.
3. In Railway, set (or confirm) these two vars:
   ```
   SUPER_ADMIN_BOOTSTRAP_ENABLED=true
   SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID=<your uid>
   ```
4. Make one authenticated request to any admin-only endpoint using your Firebase UID as the Bearer token:
   ```bash
   curl -H "Authorization: Bearer <your-firebase-uid>" \
     https://your-railway-url/api/v1/admin/access-model
   ```
   The backend will auto-promote your user to SUPER_ADMIN on this request.
5. Now log into `admin.asur.store`, enter your Firebase UID as the bearer token → you're in.
6. **Once verified**, set `SUPER_ADMIN_BOOTSTRAP_ENABLED=false` in Railway to close the bootstrap door.

### Option B: Seed script
If you have local access to the repo and a MongoDB URI:
```bash
MONGODB_URI="your-atlas-uri" pnpm -C apps/backend seed
```
The seed script creates demo products and one admin invite. Use the invite to accept admin access.

---

## Step 8 — Add your first products

Once logged into the admin panel:

1. Go to `admin.asur.store/products` → **+ New product**.
2. Fill in title, description, category, fit.
3. Add at least one variant (size, color, SKU, stock, price in paise — e.g. `89900` = ₹899).
4. Set status to **Active**.
5. Click **Create product** → it appears immediately on `asur.store/products`.

To add a product image:
- Upload the image to your R2 bucket via the Cloudflare dashboard (R2 → bucket → Upload).
- Copy the public URL (`https://pub-xxxx.r2.dev/your-image.jpg`).
- Currently, media URLs are set via the API. Until the image upload UI is built, you can use the Swagger UI at `https://your-railway-url/api/docs` → `PATCH /api/v1/admin/products/:id` to add a `media` array.

---

## Step 9 — CORS configuration

The backend needs to accept requests from your Vercel URLs. Check `apps/backend/src/app.ts` for the CORS config.

If you see CORS errors in the browser, add your production origins:

```typescript
// apps/backend/src/app.ts
app.use(cors({
  origin: [
    "https://asur.store",
    "https://admin.asur.store",
    "https://vendor.asur.store",
    // Also allow Vercel preview URLs for testing:
    /\.vercel\.app$/
  ],
  credentials: true
}));
```

Commit this change, push, and Railway will redeploy automatically.

---

## Step 10 — End-to-end smoke test

Run through the complete customer flow to verify everything is connected:

### Customer flow
1. `asur.store` loads → products appear (fetched from backend → MongoDB)
2. Click a product → variant picker works
3. Add to cart → cart badge increments
4. Go to cart → quantity controls work
5. Click **Checkout** → redirects to sign-in if not logged in
6. Sign in → redirected back to checkout
7. Enter address → continue to review
8. Click **Confirm & Pay** → Razorpay modal opens
9. Pay with test card `4111 1111 1111 1111` → confirmation page loads
10. Check Firebase Console → Authentication → user exists
11. Check Atlas → `orders` collection → order document created with `status: "paid"`

### Admin flow
1. Go to `admin.asur.store` → enter bearer token → dashboard loads
2. `/products` → your products are listed
3. `/orders` → the test order from step 9 appears with status `paid`

### Vendor flow
1. Go to `vendor.asur.store` → enter bearer token (use a user with VENDOR role)
2. `/tasks` → vendor task for the test order appears with status `pending`
3. Click task → advance through `in_progress` → `ready_to_ship` → enter tracking ID + courier → **Mark shipped**
4. Back to `admin.asur.store/orders` → order status is now `shipped`
5. On `asur.store/orders/[id]` → timeline shows **Shipped**

---

## Reference: all environment variables

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | defaults to `4000` |
| `MONGODB_URI` | Yes | Atlas connection string |
| `FIREBASE_PROJECT_ID` | Yes | from service account JSON |
| `FIREBASE_CLIENT_EMAIL` | Yes | from service account JSON |
| `FIREBASE_PRIVATE_KEY` | Yes | from service account JSON (include full `-----BEGIN...`) |
| `RAZORPAY_KEY` | Yes | Razorpay Key ID |
| `RAZORPAY_SECRET` | Yes | Razorpay Key Secret |
| `R2_ACCOUNT_ID` | No* | Cloudflare account ID |
| `R2_ACCESS_KEY` | No* | R2 API token access key |
| `R2_SECRET_KEY` | No* | R2 API token secret |
| `R2_BUCKET` | No* | bucket name |
| `R2_PUBLIC_URL` | No* | public bucket URL |
| `SUPER_ADMIN_BOOTSTRAP_ENABLED` | No | `true` for first login only |
| `SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID` | No | your Firebase UID for bootstrap |

*R2 vars are optional — the storefront shows placeholder gradients without them.

### `asur-web` (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Railway backend URL |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | from Firebase SDK config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | from Firebase SDK config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | from Firebase SDK config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | from Firebase SDK config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | from Firebase SDK config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | from Firebase SDK config |
| `NEXT_PUBLIC_RAZORPAY_KEY` | Yes | Razorpay Key ID (same as backend) |
| `NEXT_PUBLIC_ADMIN_URL` | No | admin app URL for post-login redirect |

### `asur-admin` and `asur-vendor` (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Railway backend URL |

---

## Troubleshooting

**"Failed to load products" on the storefront**
- Check `NEXT_PUBLIC_API_URL` in Vercel — should be your Railway URL with no trailing slash.
- Check CORS in `apps/backend/src/app.ts` — your Vercel domain must be allowed.
- Check Railway logs for backend errors.

**"Authentication required" on checkout**
- Firebase keys in Vercel are wrong or missing.
- Your Vercel domain is not in Firebase → Authentication → Authorized domains.

**"Invalid payment signature" after Razorpay payment**
- `RAZORPAY_KEY` on the backend doesn't match `NEXT_PUBLIC_RAZORPAY_KEY` on the frontend.
- Both must be the same key pair (test or live — don't mix them).

**Orders not persisting after restart**
- `MONGODB_URI` is not set in Railway — backend is running in-memory mode.
- Check Railway → Variables → confirm `MONGODB_URI` is present and correct.

**Admin panel shows "Vendor access required"**
- Your user's role in MongoDB is `CUSTOMER`. Run the bootstrap step (Step 7) to promote it to `SUPER_ADMIN`.

**Vendor tasks not appearing**
- Tasks are created when a Razorpay payment is verified. Complete a full test checkout first (Step 10).
- If using mock mode (no Razorpay keys), the mock payment flow also creates vendor tasks.

**FIREBASE_PRIVATE_KEY formatting error in Railway**
- The key must include literal `\n` sequences, not actual newlines.
- In Railway, paste it exactly as it appears in the JSON file, wrapped in double quotes: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`.
