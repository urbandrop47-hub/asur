# Environment Setup — Required Keys & Services

This file lists every external service credential the app needs, what each one does, how to get it, and where to put it. Work through each section before running the full checkout flow end-to-end.

---

## 1. Firebase (Authentication)

**What it does:** Manages customer and admin identity. The frontend uses the public SDK to sign in; the backend uses a service account to verify the ID token.

### Backend service account (Railway / `.env` in `apps/backend`)

| Variable | Where to get it |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project settings → General → Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Project settings → Service accounts → Generate new private key → `client_email` field |
| `FIREBASE_PRIVATE_KEY` | Same JSON download → `private_key` field. Paste the entire value including `-----BEGIN PRIVATE KEY-----`. In Railway/Vercel wrap it in double quotes. |

### Frontend public config (Vercel / `.env.local` in `apps/web`)

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → Your apps → Web app → SDK snippet |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same snippet |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same snippet |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same snippet |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same snippet |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same snippet |

**Admin URL** (needed for post-login redirect of admin users):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_ADMIN_URL` | Your deployed admin app URL, e.g. `https://admin.asur.store`. Use `http://localhost:3001` locally. |

### Local dev without Firebase

Set `SUPER_ADMIN_BOOTSTRAP_ENABLED=true` and use the bootstrap Firebase UID as the Bearer token. See `README.md → First Super Admin`.

---

## 2. Razorpay (Payments — TEST mode)

**What it does:** Creates payment orders and verifies signatures. The app uses **test mode** keys so no real money is charged.

| Variable | Where to get it |
|---|---|
| `RAZORPAY_KEY` | Razorpay Dashboard → Settings → API Keys → Generate test key → Key ID |
| `RAZORPAY_SECRET` | Same page → Key Secret |
| `NEXT_PUBLIC_RAZORPAY_KEY` | Same Key ID — the frontend needs it to open the Razorpay checkout modal |

**Test card:** 4111 1111 1111 1111, any future expiry, any CVV.
**Test UPI:** `success@razorpay`

If both `RAZORPAY_KEY` and `RAZORPAY_SECRET` are empty the backend falls back to a mock order with a fake `rzp_` prefix. Payment verification always returns `true` in mock mode. This means **the full checkout flow works end-to-end without Razorpay keys** — use mock mode to test the UI first.

---

## 3. MongoDB Atlas (Database)

**What it does:** Persists users, products, orders, payments, and vendor tasks.

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | Atlas Console → Database → Connect → Connect your application → copy the connection string. Replace `<password>` with your DB user password. |

If `MONGODB_URI` is empty the backend runs entirely in memory (all data is lost on restart). This is fine for frontend development.

**Local Mongo (Docker):**
```bash
docker compose up -d mongo
# then set:
MONGODB_URI=mongodb://localhost:27017/asur
```

---

## 4. Cloudflare R2 (Product image storage)

**What it does:** Stores product images. The frontend fetches images by public URL.

| Variable | Where to get it |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare Dashboard → R2 → Overview → Account ID |
| `R2_ACCESS_KEY` | R2 → Manage R2 API tokens → Create API token → Access Key ID |
| `R2_SECRET_KEY` | Same token creation → Secret Access Key |
| `R2_BUCKET` | The name of your R2 bucket |
| `R2_PUBLIC_URL` | R2 → your bucket → Settings → Public access → Public bucket URL (e.g. `https://pub-xxxx.r2.dev`) |

R2 is **optional for MVP** — the storefront shows gradient placeholders when `media` is empty on a product.

---

## 5. Where to put env vars

### Local development

Create `apps/backend/.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/asur
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
RAZORPAY_KEY=rzp_test_xxxx
RAZORPAY_SECRET=xxxx
```

Create `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxx
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_xxxx
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

### Production

- **Railway** (backend): paste all backend vars in the Railway project → Service → Variables tab.
- **Vercel** (web): paste all `NEXT_PUBLIC_*` vars in Vercel → Project → Settings → Environment Variables.
- Never put `FIREBASE_PRIVATE_KEY`, `RAZORPAY_SECRET`, or `MONGODB_URI` in Vercel — those are server-only secrets.

---

## 6. Swagger API docs

Once the backend is running, visit:

```
http://localhost:4000/api/docs
```

All endpoints are documented there with request/response schemas.

---

## 7. Quick smoke test (no external credentials)

```bash
# Start backend in mock mode (no Mongo, no Firebase, no Razorpay)
pnpm -C apps/backend dev

# Verify health
curl http://localhost:4000/health

# List products (returns in-memory seed data)
curl http://localhost:4000/api/v1/products

# Swagger UI
open http://localhost:4000/api/docs
```
