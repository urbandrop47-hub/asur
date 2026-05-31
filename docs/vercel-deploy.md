# Deploying ASUR apps to Vercel

This guide explains how to create separate Vercel Projects for each Next.js app in the monorepo and the exact dashboard settings to use. Follow the steps below for `asur-web`, `asur-admin`, and `asur-vendor`.

## Why per-app projects?
A monorepo with multiple Next.js apps should use one Vercel Project per app to avoid cross-app `.next` path conflicts and to keep environment variables isolated per app.

## Projects to create
- asur-web (apps/web)
- asur-admin (apps/admin)
- asur-vendor (apps/vendor)

## Common dashboard settings
- Install Command: `pnpm install --no-frozen-lockfile`
- Build Command: leave blank (Vercel auto-detects Next) or use `pnpm build`
- Output Directory: leave blank for Next.js

> Note: We added `apps/web/vercel.json`, `apps/admin/vercel.json`, and `apps/vendor/vercel.json` to the repo to support repo-driven builds. If you use the Vercel dashboard settings instead, the per-app files are optional.

## Step-by-step: create `asur-web`
1. In Vercel, click "New Project" and import the repo `urbandrop47-hub/asur`.
2. Set the Root Directory to `apps/web`.
3. Leave the Build Command empty or set it to `pnpm build`.
4. Set Install Command: `pnpm install --no-frozen-lockfile`.
5. Leave Output Directory empty.
6. Under Environment Variables, add the following (for Production):
   - `NEXT_PUBLIC_API_URL` = https://<your-backend-url>
   - `NEXT_PUBLIC_FIREBASE_API_KEY` = <your-firebase-api-key>
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = <your-firebase-auth-domain>
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = <your-firebase-project-id>
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = <your-firebase-storage-bucket>
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = <your-firebase-messaging-sender-id>
   - `NEXT_PUBLIC_FIREBASE_APP_ID` = <your-firebase-app-id>
   - `NEXT_PUBLIC_RAZORPAY_KEY` = <your-razorpay-key>
7. Deploy the project.

## Step-by-step: create `asur-admin`
1. New Project → import the repo.
2. Root Directory: `apps/admin`.
3. Build Command: leave empty or `pnpm build`.
4. Install Command: `pnpm install --no-frozen-lockfile`.
5. Output Directory: leave blank.
6. Env (Production): add any needed `NEXT_PUBLIC_*` variables the admin UI uses (same keys as web if admin uses Firebase or Razorpay client SDKs).
7. Deploy.

## Step-by-step: create `asur-vendor`
1. New Project → import the repo.
2. Root Directory: `apps/vendor`.
3. Build Command: leave empty or `pnpm build`.
4. Install Command: `pnpm install --no-frozen-lockfile`.
5. Output Directory: leave blank.
6. Env (Production): add any needed `NEXT_PUBLIC_*` variables the vendor UI uses.
7. Deploy.

## Backend (Railway)
Server-only secrets (do not add these to Vercel):
- `MONGODB_URI`
- `JWT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `RAZORPAY_SECRET`
- `R2_*` credentials

Set the above in Railway (or your chosen server host). Configure `NEXT_PUBLIC_API_URL` in the `asur-web` and `asur-admin` Vercel projects to point at your Railway backend URL.

## Troubleshooting
- Error: "The Next.js output directory \"apps/web/.next\" was not found": ensure you are building the correct app root in Vercel, and there is no root-level `outputDirectory` in the repo `vercel.json` pointing at a different app.
- If using Turborepo remote caching, ensure `turbo.json` includes `.next/**` and the app-specific outputs such as `apps/web/.next/**`.

## Optional: Repo-driven per-app files
If you prefer repo-driven configuration, keep the per-app `vercel.json` files in each app folder (we added them already):
- `apps/web/vercel.json`
- `apps/admin/vercel.json`
- `apps/vendor/vercel.json`

These files use `pnpm build` as the build command and the correct install command. When using per-app `vercel.json`, set the Vercel Project Root to the matching app folder.

---

If you'd like, I can also add quick screenshots or a one-line command to programmatically create Vercel Projects via the Vercel CLI. Would you like that?
