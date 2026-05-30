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
- `NEXT_PUBLIC_RAZORPAY_KEY`

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
