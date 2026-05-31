# ASUR Commerce Platform

ASUR is a custom fashion commerce platform built as a monorepo with separate customer, admin, vendor, and backend surfaces.

## Architecture

- Frontend storefront: Next.js on Vercel
- Backend API: Node.js + Express on Railway
- Database: MongoDB Atlas
- Authentication: Firebase Authentication
- Payments: Razorpay
- File storage: Cloudflare R2
- Shared state: Zustand
- Validation: Zod
- Monorepo tooling: Turborepo + pnpm workspace layout

## Repository Layout

- `apps/web` - Customer storefront
- `apps/admin` - Internal operations dashboard
- `apps/vendor` - Vendor fulfillment dashboard
- `apps/backend` - Express API with controller/service/repository separation
- `packages/ui` - Shared UI primitives
- `packages/types` - Shared TypeScript domain types
- `packages/validations` - Shared Zod schemas
- `packages/constants` - Shared app and domain constants
- `packages/api-client` - Fetch wrapper for client-server communication
- `packages/utils` - Shared utility helpers

## Local Development

The repo is configured for Turborepo-style development scripts.

```bash
pnpm install
pnpm dev
```

If you are running in an environment without `pnpm` available globally, use the bundled Node runtime together with your preferred package manager bootstrap.

## Key Environment Variables

Backend:

- `PORT`
- `MONGODB_URI`
- `SUPER_ADMIN_BOOTSTRAP_ENABLED`
- `SUPER_ADMIN_BOOTSTRAP_EMAIL`
- `SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID`
- `SUPER_ADMIN_BOOTSTRAP_NAME`
- `SUPER_ADMIN_BOOTSTRAP_PHONE`
- `SUPER_ADMIN_BOOTSTRAP_AVATAR_URL`
- `JWT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `RAZORPAY_KEY`
- `RAZORPAY_SECRET`
- `R2_ACCESS_KEY`
- `R2_SECRET_KEY`
- `R2_BUCKET`
- `R2_ACCOUNT_ID`
- `R2_PUBLIC_URL`

Frontend:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_RAZORPAY_KEY`

## Env mapping (where to set each variable)

The project splits configuration across platform consoles (MongoDB Atlas, Cloudflare, Railway, Vercel, Firebase). Below is a concise mapping of which variables belong to which service and where the backend/frontend read them in the codebase.

- MongoDB Atlas → Database
  - Variables to set: `MONGODB_URI`
  - Where to set: Railway (backend service environment) or your local `.env` during development.
  - Where it's read: `apps/backend/src/config/env.ts` and used by `apps/backend/src/config/database.ts` (`connectDatabase`).

- Cloudflare R2 → Storage
  - Variables to set: `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_PUBLIC_URL`
  - Where to set: Railway (backend service environment) or local `.env` for development.
  - Where it's read: `apps/backend/src/config/env.ts` and referenced by storage/upload helpers in `/apps/backend/src`.

- Railway → Backend (server-side secrets)
  - Variables to set: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `RAZORPAY_KEY`, `RAZORPAY_SECRET`, R2 vars listed above, plus any other server-only secrets.
  - Where to set: Railway project / service environment variables (or `.env` locally).
  - Where it's read: `apps/backend/src/config/env.ts` (single source of truth for backend envs).

- Vercel → Frontend (public build-time vars)
  - Variables to set: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_RAZORPAY_KEY`
  - Where to set: Vercel Project → Environment Variables. These are injected at build time for automatic deploys.
  - Where it's read: Client-side code in `apps/web` (and `apps/vendor`/`apps/admin` if they use similar NEXT_PUBLIC_* keys). Local development can use `apps/web/.env.local`.

- Firebase → Auth (service account for backend; public keys for frontend)
  - Backend (service account) variables: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — set these on Railway (server) only.
  - Frontend (public) variables: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` — set these on Vercel.
  - Where it's read: Backend verifier in `apps/backend/src/auth/firebase.ts` uses the service-account envs; the frontend uses NEXT_PUBLIC_* values to initialize Firebase SDK in `apps/web` (`apps/web/src` or `apps/web/app` files).

Notes:
- Vercel injects only variables that start with `NEXT_PUBLIC_` into client bundles. Do NOT put server-only secrets (like `FIREBASE_PRIVATE_KEY` or `JWT_SECRET`) into Vercel public envs.
- Railway (or any other server host) must hold the server-side secrets. The backend's `env.ts` loads `.env` files locally and otherwise reads `process.env` in production.
- For local development you can place env files at repository root or under `apps/backend/` — `apps/backend/src/config/env.ts` already looks for both locations.

## Vercel per-app deployments (monorepo guidance)

This repository is a Turborepo monorepo with multiple Next.js apps. The safest way to deploy to Vercel is to create one Vercel Project per app and point each project at the app's folder as the "Root Directory". This avoids cross-app `.next` path conflicts and keeps environment variables isolated.

Recommended Vercel Projects and settings:

- Project: asur-web (customer storefront)
  - Root Directory: `apps/web`
  - Build Command: leave blank (Vercel auto-detects Next) or use `pnpm -C apps/web build`
  - Install Command: `pnpm install --no-frozen-lockfile`
  - Output Directory: leave blank for Next.js
  - Env: add `NEXT_PUBLIC_*` frontend variables (see Key Environment Variables)

- Project: asur-admin (admin dashboard)
  - Root Directory: `apps/admin`
  - Build Command: leave blank or `pnpm -C apps/admin build`
  - Install Command: `pnpm install --no-frozen-lockfile`
  - Output Directory: leave blank
  - Env: any NEXT_PUBLIC_* keys the admin app needs

- Project: asur-vendor (vendor dashboard)
  - Root Directory: `apps/vendor`
  - Build Command: leave blank or `pnpm -C apps/vendor build`
  - Install Command: `pnpm install --no-frozen-lockfile`
  - Output Directory: leave blank
  - Env: any NEXT_PUBLIC_* keys the vendor app needs

Notes and alternatives:
- If you previously used a root-level `vercel.json` with `outputDirectory` pointing at `apps/web/.next`, remove or avoid that — it causes other app builds to search for `apps/web/.next` and fail during CI. Per-app `vercel.json` files (added under each app folder) are a safer pattern.
- We added `apps/web/vercel.json` and `apps/admin/vercel.json` in this repo so you can keep repo-driven build commands. If you use the Vercel dashboard settings, those per-app files are optional.
- For Turborepo caching, ensure `turbo.json` includes `.next/**` outputs; this repo already lists `.next/**` and app-specific outputs like `apps/web/.next/**`.


### Quick Vercel project creation checklist (copy-paste)

Use this when creating a new Vercel Project. Set the "Root Directory" to the app folder and paste the commands below where applicable.

- asur-web (customer storefront)
  - Root Directory: `apps/web`
  - Install Command: `pnpm install --no-frozen-lockfile`
  - Build Command: leave blank or `pnpm -C apps/web build`

- asur-admin (admin dashboard)
  - Root Directory: `apps/admin`
  - Install Command: `pnpm install --no-frozen-lockfile`
  - Build Command: leave blank or `pnpm -C apps/admin build`

- asur-vendor (vendor dashboard)
  - Root Directory: `apps/vendor`
  - Install Command: `pnpm install --no-frozen-lockfile`
  - Build Command: leave blank or `pnpm -C apps/vendor build`


## What the current scaffold covers

- Next.js storefront pages for products, cart, checkout, orders, auth, collections, and account
- Admin dashboard for operational monitoring and content approval
- Vendor dashboard for offline fulfillment workflows
- Express backend with versioned `/api/v1` routes
- Firebase-based authentication session flow
- Razorpay payment creation and verification hooks
- MongoDB-ready models, repositories, and mock fallbacks for local development

## Notes

- The backend falls back to in-memory repositories when `MONGODB_URI` is not set.
- Firebase and Razorpay integrations also degrade gracefully in local dev when credentials are missing.
- Shared packages are source-first so the apps can import them directly during development.

## Local Mongo Setup

The repo includes a local MongoDB container for development.

```bash
docker compose up -d mongo
```

Then point the backend at the local database:

```bash
MONGODB_URI=mongodb://localhost:27017/asur
```

The backend also looks for env files in both the repo root and `apps/backend/`, so you can place the Atlas URI in whichever location matches your workflow.

## Seed Atlas Data

To create starter data in MongoDB Atlas:

```bash
pnpm -C apps/backend seed
```

Useful seed env overrides:

- `SEED_RESET=true` clears the seeded collections before inserting again.
- `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_FIREBASE_UID` control the first admin user.
- `SEED_CUSTOMER_EMAIL` and `SEED_CUSTOMER_FIREBASE_UID` control the sample customer.
- `SEED_ADMIN_INVITE_TOKEN` lets you choose the sample invite token.

The seed command adds:

- a `SUPER_ADMIN` user
- a sample customer
- three T-shirt products
- one pending admin invite

## Firebase Setup

Firebase is the identity provider for the real auth flow.

Backend service-account env vars:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Frontend public auth vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_ADMIN_URL`

Suggested setup flow:

1. Create or open your Firebase project.
2. Enable the auth providers you want to support.
3. Add the backend service account values to your backend env file.
4. Add the frontend public auth values to your web env file.
5. Sign in through the frontend and exchange the Firebase ID token with `POST /api/v1/auth/session`.
6. Confirm the backend returns a persisted `AuthSession` and a user record in MongoDB.

## First Super Admin

Invite creation is restricted to admin users, so the first `SUPER_ADMIN` needs a bootstrap path.

If you want to manage the first admin manually, the simplest path is:

1. Create the user in Firebase.
2. Save that user in MongoDB with `role: "ADMIN"` or `role: "SUPER_ADMIN"`.
3. Sign in through the frontend with that Firebase account.
4. The backend session and admin routes will read the role from Mongo and allow admin access.

Recommended local flow:

1. Start Mongo locally.
2. Create or identify the user you want to promote in MongoDB, or provide a Firebase UID in the env.
3. Set:
   - `SUPER_ADMIN_BOOTSTRAP_ENABLED=true`
   - `SUPER_ADMIN_BOOTSTRAP_EMAIL=<your email>`
   - optionally `SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID=<firebase uid>`
4. Start the backend once.
5. The backend will promote that user to `SUPER_ADMIN` and you can then create invite-based admin accounts from the admin routes.

If you prefer manual Mongo setup, you can also create the user document yourself and set `role: "SUPER_ADMIN"` directly in the `users` collection before starting the admin-only flow.

If Firebase is not configured yet, you can still verify the admin routes locally in development:

1. Set `SUPER_ADMIN_BOOTSTRAP_ENABLED=true`.
2. Use the bootstrap Firebase UID or bootstrap email as the bearer token.
3. Call a protected route such as `GET /api/v1/admin/access-model`.

Example:

```bash
curl -H "Authorization: Bearer <SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID>" \
  http://localhost:4000/api/v1/admin/access-model
```
