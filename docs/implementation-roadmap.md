# ASUR E-Commerce Implementation Roadmap

This document is the working backlog for turning the current scaffold into a fully functional, mobile-first T-shirt store.

Pick one ticket at a time, starting from the top. Mark it `IN PROGRESS`, implement, verify, then mark `DONE` before moving to the next.

## Status Legend

- `TODO` = not started
- `IN PROGRESS` = actively being worked on
- `BLOCKED` = waiting on a dependency
- `DONE` = finished and verified

## Product Direction

- Primary goal: a mobile-first, end-to-end T-shirt commerce platform driven by an admin control plane
- Core customer flow: browse → product detail → select variant → add to cart → login → checkout (address → review → pay) → order confirmation → order tracking
- Secondary surfaces: vendor fulfillment workflow, admin operations dashboard
- First release scope: functional MVP with strong mobile usability
- Deferred from v1: reviews, wishlists, loyalty, subscriptions, personalized recommendations, CRM tooling

## Current State (as of Sprint 0 complete)

**Done and verified:**
- Firebase auth: email/password + Google sign-in, provider linking, account merge
- Backend auth session: Firebase token exchange → MongoDB user lookup
- Shared types (`@asur/types`), validations (`@asur/validations`), constants (`@asur/constants`)
- Product Mongoose model + repository (Mongo + in-memory fallback)
- Backend product, order, payment, auth controllers and routes
- Zustand cart store and auth store with localStorage session persistence
- Admin roles and permission constants defined
- MongoDB seed script with 3 products, 2 users, 1 invite

**Scaffolded but not functional (placeholder/documentation pages):**
- `apps/web/app/page.tsx` — architecture overview, not a real storefront homepage
- `apps/web/app/products/page.tsx` — renders static `featuredProducts`, no API call
- `apps/web/app/products/[slug]/page.tsx` — does not exist; visiting a product slug 404s
- `apps/web/app/cart/page.tsx` — renders hardcoded mock cart items, no real Add to Cart
- `apps/web/app/checkout/page.tsx` — description page, no address form or Razorpay integration
- `apps/web/app/orders/page.tsx` — placeholder, no API call
- `apps/web/app/account/page.tsx` — placeholder
- Order, Payment, VendorTask have no Mongoose models (all orders stay in-memory mock store)
- Admin panel `apps/admin` — no product management or real data yet
- Mobile nav — no hamburger menu; nav links can overflow on narrow screens

---

## Sprint 1 — Real Storefront (API-Wired Web Pages)

**Goal:** Replace every placeholder web page with real, API-backed content. Products come from the backend. The homepage looks like a real store. Navigation works on phones.

---

### S1-T1 — Wire the products listing page to the backend API

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/products/page.tsx` — remove static `featuredProducts` import; fetch from `GET /api/v1/products` using the `api` client; show skeleton loaders while loading; show error state on failure
  - `apps/web/components/product-card.tsx` — link "Add to cart" button to a toast/redirect rather than hardcoded href; link "View details" to `/products/[slug]` (already done, keep it)
- Acceptance criteria:
  - Products come from the backend API (or in-memory mock if Mongo not configured)
  - Loading state is visible during fetch
  - If the API is unreachable, a user-friendly error message shows
  - Product grid is readable on 390px wide screen (single column)
- Mobile spec:
  - Single-column grid at `<640px`
  - Two-column grid at `640px–1024px`
  - Three-column grid at `>1024px`
  - Product card touch targets (buttons) at minimum 44px height

---

### S1-T2 — Build the product detail page

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/products/[slug]/page.tsx` — create this file; fetch `GET /api/v1/products/:slug`; render title, description, price, category, fit, collection, stock count; include a variant section placeholder (wired in S2-T1); include "Add to Cart" button placeholder; handle slug-not-found with a 404 state
  - `apps/web/components/product-image-gallery.tsx` — create; render `product.media` images or a styled gradient placeholder when media is empty; support at least one main image with aspect ratio `4:5`
- Acceptance criteria:
  - Visiting `/products/ember-overshirt` (or any seeded product slug) renders real data
  - Media section renders gradient placeholder when `product.media` is empty
  - Price is formatted with `formatCurrency` from `@asur/utils`
  - Stock count shows "In stock", "Low stock (N left)", or "Out of stock"
  - Page works on 390px screen without horizontal scroll
- Mobile spec:
  - Image gallery takes full device width on mobile
  - Product title, price, and CTA are visible above the fold on a 390×844 screen
  - "Add to Cart" button is full-width on mobile, max 400px on desktop

---

### S1-T3 — Redesign the homepage as a real storefront landing page

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/page.tsx` — replace the architecture-overview content; add a hero section with headline, sub-headline, and "Shop now" CTA linking to `/products`; render 3–6 featured products fetched from `GET /api/v1/products`; add a collections strip if collection slugs are present on the returned products
  - `apps/web/lib/catalog.ts` — keep `releaseWorkflow` and `commerceBlueprint` for internal use but stop importing them in the homepage
  - `apps/web/app/globals.css` — add `.hero` styles (full-width, dark gradient, centered text, responsive font sizing with `clamp`)
- Acceptance criteria:
  - Homepage shows real products (from API) under a proper hero section
  - "Shop now" CTA links to `/products`
  - Page is visually compelling and mobile-readable
  - No architecture documentation is visible to the end customer
- Mobile spec:
  - Hero section occupies at least 70vh on mobile
  - Hero CTA button is easy to tap (44px+ height, full-width on mobile)
  - Featured products render in a two-item row on mobile

---

### S1-T4 — Add mobile navigation (hamburger menu)

- Status: `DONE`
- Files to create / edit:
  - `apps/web/components/site-header.tsx` — add a hamburger toggle button visible at `<768px`; implement a slide-in nav drawer or full-screen overlay; show nav links (`Products`, `Collections`, `Cart`, `Orders`, `Account`) in the drawer; show `Sign in` or user email/avatar depending on auth state from `useAuthStore`; add cart item count badge on the Cart link
  - `apps/web/app/globals.css` — add `.nav-drawer`, `.nav-overlay`, `.hamburger` styles; hide desktop nav links at `<768px`; hide hamburger at `>=768px`
- Acceptance criteria:
  - On mobile, desktop nav links are hidden and hamburger button appears
  - Tapping hamburger opens a full-height drawer with nav links
  - Tapping a link or the overlay closes the drawer
  - Cart link shows item count badge when cart has items
  - Auth state (signed in vs anonymous) is reflected in the header
- Mobile spec:
  - Hamburger icon is 44×44px tap target
  - Drawer overlays the full screen
  - Each nav link in the drawer is 52px tall (easy to tap)
  - Backdrop/overlay closes drawer on tap

---

### S1-T5 — Fix mobile responsive layouts across all web pages

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/globals.css` — replace the single `@media (max-width: 960px)` breakpoint with three breakpoints: `<640px` (mobile), `640px–1024px` (tablet), `>1024px` (desktop); fix `.hero-grid` to stack vertically on mobile; fix `.metrics` to single-column on mobile; fix `.section-title` to stack vertically with smaller heading sizes; add `padding: 0 1rem` on mobile `main` so content has breathing room; fix `.actions` flex-wrap with adequate gap on mobile
  - `apps/web/app/products/page.tsx` — apply proper grid class
  - `apps/web/app/cart/page.tsx` — apply mobile-aware layout
- Acceptance criteria:
  - All pages render without horizontal scroll on 390px width
  - Text is legible without pinching/zooming
  - Buttons are tappable (44px min height)
  - Grids collapse to single column on mobile

---

## Sprint 2 — Real Cart

**Goal:** Customers can select a variant on the product detail page, add items to the cart, manage quantities, and cart state persists across refreshes.

---

### S2-T1 — Add variant selection UI to the product detail page

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/products/[slug]/page.tsx` — add size selector (pill/button group for each available size in `product.variants`); add color selector (colored dot or pill for each color); selecting size + color determines which `ProductVariant` is active; show the selected variant's price, SKU, and stock; disable combinations that have `stock: 0`
  - `apps/web/components/variant-picker.tsx` — create; receives `variants: ProductVariant[]`, emits `onSelect: (variant: ProductVariant) => void`; renders size and color as two separate button groups; disables out-of-stock combinations
- Acceptance criteria:
  - User can pick a size and color; price and stock update instantly
  - Out-of-stock variants are visually disabled (strikethrough or grayed, not clickable)
  - Selected state is clearly indicated with an accent border/ring
  - Variant picker is thumb-friendly on mobile (pill height 44px+)
- Mobile spec:
  - Size/color pills wrap cleanly when there are many options
  - Selected variant info (price, stock) is visible without scrolling past the picker

---

### S2-T2 — Wire "Add to Cart" to the real cart store

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/products/[slug]/page.tsx` — wire "Add to Cart" button to `useCartStore.addItem()` with the selected variant's SKU, price, product ID, and quantity 1; show a success toast or inline confirmation after adding; button is disabled until a valid variant is selected and in stock
  - `apps/web/store/cart-store.ts` — update `addItem` to merge quantity if the same `variantSku` already exists in cart (increment quantity instead of adding a duplicate); remove hardcoded mock items from initial state (start with empty `items: []`)
  - `apps/web/components/product-card.tsx` — replace the hardcoded `/cart` link with a real `addItem` call using the product's first variant; show a brief confirmation ("Added")
- Acceptance criteria:
  - Adding an item from the PDP increments cart count in the header badge
  - Adding the same SKU twice increments quantity, not duplicates
  - Cart starts empty on first visit (no mock data)
  - The "Add to Cart" button is disabled while no valid variant is chosen

---

### S2-T3 — Persist cart to localStorage

- Status: `DONE`
- Files to create / edit:
  - `apps/web/store/cart-store.ts` — add Zustand `persist` middleware wrapping the store; use `localStorage` as the storage engine; key: `asur-cart`; persist only `items` (not computed values like `subtotal`)
  - `apps/web/providers/index.tsx` (or equivalent) — ensure the store is hydrated on mount to avoid SSR mismatch; use `useEffect` guard or Zustand `skipHydration` pattern
- Acceptance criteria:
  - Cart items survive a browser refresh
  - Cart items survive navigating away and back
  - No hydration mismatch errors in the console
  - Clearing cart removes localStorage entry

---

### S2-T4 — Build a usable cart page

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/cart/page.tsx` — replace mock-data render with real `useCartStore` items; show product title, variant SKU, unit price, quantity, and line total for each item; add "+" / "−" quantity buttons that call `updateQuantity` on the store; add "Remove" button per line item; show empty cart state with "Browse products" CTA when cart is empty; show subtotal, estimated shipping note, and "Proceed to Checkout" CTA at the bottom
  - `apps/web/store/cart-store.ts` — add `updateQuantity(variantSku: string, quantity: number)` action; add guard: if quantity drops to 0, remove the item
- Acceptance criteria:
  - Cart shows real items from the store
  - Quantity buttons update totals instantly
  - Empty cart state is clean and has a path to products
  - Subtotal is always accurate
  - "Proceed to Checkout" button is prominent and links to `/checkout`
- Mobile spec:
  - Each cart row is clearly separated with enough padding
  - Quantity controls (buttons) are 44px tap targets
  - Checkout CTA is sticky at the bottom on mobile (fixed position bar with subtotal + button)

---

## Sprint 3 — Auth Gate & Smooth Checkout

**Goal:** Checkout is a single-page, multi-step flow. Users are redirected to sign in if not authenticated. The flow covers address → order review → Razorpay payment → confirmation, with no jarring page reloads between steps.

---

### S3-T1 — Auth gate: redirect unauthenticated users to sign in before checkout

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/checkout/page.tsx` — add a `useEffect` that checks `useAuthStore` session; if no session, redirect to `/auth?next=/checkout`; show a loading spinner while checking auth state
  - `apps/web/app/auth/page.tsx` — read `next` query param; after successful sign-in and session creation, redirect to the `next` URL instead of staying on the auth page
  - `apps/web/components/auth-panel.tsx` — accept a `redirectTo?: string` prop and use `router.push(redirectTo)` after `setSession` is called
- Acceptance criteria:
  - Visiting `/checkout` without a session redirects to `/auth?next=/checkout`
  - Completing sign-in brings the user back to `/checkout` with their cart intact
  - If already signed in, `/checkout` loads directly with no redirect

---

### S3-T2 — Backend: add address save and retrieve to user profile

- Status: `DONE`
- Files to create / edit:
  - `apps/backend/src/models/user.model.ts` — add `addresses: [addressSchema]` field to the user schema; `Address` type from `@asur/types` already has the right shape
  - `apps/backend/src/repositories/user.repository.ts` — add `saveAddress(userId, address)` and `listAddresses(userId)` methods; use Mongo `$addToSet` or push to array
  - `apps/backend/src/controllers/auth.controller.ts` — add `GET /api/v1/auth/addresses` and `POST /api/v1/auth/addresses` handlers (or create a dedicated user controller)
  - `apps/backend/src/routes/auth.routes.ts` — mount the two new address routes behind the `requireSession` middleware
- Acceptance criteria:
  - `POST /api/v1/auth/addresses` saves an address to the current user's profile
  - `GET /api/v1/auth/addresses` returns the user's saved addresses
  - Routes are protected; unauthenticated requests return 401

---

### S3-T3 — Build the multi-step checkout page (step 1: shipping address)

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/checkout/page.tsx` — implement a 3-step wizard managed with local state (`step: 1 | 2 | 3`); step 1 is the shipping address form
  - `apps/web/components/checkout/step-indicator.tsx` — create; renders "1 Address · 2 Review · 3 Payment" with active/completed state indicators
  - `apps/web/components/checkout/address-form.tsx` — create; fields: full name, phone, address line 1, address line 2, city, state, pincode; use `<input type="tel">` for phone, `inputMode="numeric"` for pincode; inline validation using `@asur/validations` addressSchema; on submit, call `POST /api/v1/auth/addresses` and advance to step 2
- Acceptance criteria:
  - Step 1 renders a clean, labeled address form
  - Validation errors appear inline on blur and on submit
  - Phone and pincode fields open the numeric keyboard on mobile
  - On valid submit, address is saved to backend and user advances to step 2
  - If user has saved addresses, show a "Use saved address" option to pre-fill the form
- Mobile spec:
  - Inputs are at least 48px tall
  - Labels are above the inputs (not floating or inside)
  - "Next" button is full-width and sticks above the keyboard on iOS
  - No horizontal scroll

---

### S3-T4 — Checkout step 2: order review

- Status: `DONE`
- Files to create / edit:
  - `apps/web/components/checkout/order-review.tsx` — create; show cart items with images/placeholders, quantities, and prices; show shipping address entered in step 1; show price breakdown: subtotal, shipping (₹0 if >₹150, else ₹250), GST (5%), and total; show "Edit address" link to go back to step 1; show "Confirm & Pay" button to advance to step 3
  - `apps/web/app/checkout/page.tsx` — render `<OrderReview>` in step 2 position; pass cart items from `useCartStore` and address from step 1 state
- Acceptance criteria:
  - All cart items are shown with correct quantities and totals
  - Shipping address entered in step 1 is clearly displayed
  - Price breakdown is accurate: subtotal, shipping, tax, total
  - "Edit address" goes back to step 1 without losing the entered address
  - "Confirm & Pay" button is prominent and clearly labeled
- Mobile spec:
  - Price summary sticks at the bottom of the screen on mobile
  - "Confirm & Pay" CTA is above the price row, full-width

---

### S3-T5 — Checkout step 3: create backend order and launch Razorpay

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/checkout/page.tsx` — on step 3 entry: call `POST /api/v1/orders` with cart items, address, and customerId from session; on success, call `POST /api/v1/payments/razorpay/order` with the returned `orderId` and `total`; on Razorpay response, open the Razorpay checkout modal using `window.Razorpay`
  - `apps/web/app/layout.tsx` — add `<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />` from `next/script`
  - `apps/web/lib/razorpay.ts` — create; export `openRazorpayCheckout({ key, amount, currency, orderId, name, email, contact, onSuccess, onDismiss })` that wraps the Razorpay modal open/close lifecycle; on payment success callback, call `POST /api/v1/payments/razorpay/verify` with the three Razorpay response fields
  - `apps/backend/src/controllers/order.controller.ts` — update `createOrderController` to read `customerId` from `req.user.id` (from auth middleware) rather than from the request body; mount the orders route behind `requireSession` middleware
  - `apps/backend/src/routes/orders.routes.ts` — add `requireSession` middleware to both GET and POST routes
- Acceptance criteria:
  - "Confirm & Pay" creates the order draft in the backend
  - Razorpay modal opens with the correct amount and order ID
  - On payment success, the verification call is made to the backend
  - On verification success, user is redirected to `/orders/[id]/confirmation`
  - On payment failure or dismissal, user stays on the checkout page with an error message
  - Mock flow works when Razorpay credentials are not configured (test mode)
- Mobile spec:
  - Razorpay modal is mobile-friendly by default (it is, it's Razorpay's own UI)
  - "Processing payment…" loading state is shown between button tap and modal open
  - Error messages are visible without scrolling

---

### S3-T6 — Build the order confirmation page

- Status: `DONE`
- Files to create / edit:
  - `apps/web/app/orders/[id]/confirmation/page.tsx` — create; fetch `GET /api/v1/orders/:id` to load order details; show order number, status badge, items summary, shipping address, and total paid; show "Track order" link to `/orders/[id]`; show "Continue shopping" link to `/products`; clear the cart using `useCartStore.clear()` on mount
  - `apps/backend/src/controllers/order.controller.ts` — add `getOrderController` for `GET /orders/:id`; return the order by ID from the order repository; guard with `requireSession`
  - `apps/backend/src/routes/orders.routes.ts` — add `GET /:id` route
  - `apps/web/app/globals.css` — add `.confirmation-card` styles with a success accent color and a checkmark visual
- Acceptance criteria:
  - After payment, the confirmation page loads the real order from the backend
  - Order number, total, and items are correct
  - Cart is empty after landing on the confirmation page
  - "Continue shopping" and "Track order" links are present and functional
- Mobile spec:
  - Success indicator (icon + order number) is prominent at the top
  - Page is clean and reassuring; not cluttered

---

## Sprint 4 — Mongoose Order Persistence + Order History

**Goal:** Orders are persisted in MongoDB (not just the in-memory mock). Customers can view their order history and individual order details.

---

### S4-T1 — Add Mongoose models for Order, Payment, and VendorTask

- Status: `TODO`
- Files to create / edit:
  - `apps/backend/src/models/order.model.ts` — create; define `orderSchema` mapping all fields in the `Order` type; include indexes on `customerId`, `orderNumber`, and `status`; export `OrderModel`
  - `apps/backend/src/models/payment.model.ts` — create; define `paymentSchema` mapping all fields in the `Payment` type; index on `orderId`; export `PaymentModel`
  - `apps/backend/src/models/vendor-task.model.ts` — create; define `vendorTaskSchema` mapping all fields in the `VendorTask` type; index on `orderId`; export `VendorTaskModel`
  - `apps/backend/src/repositories/order.repository.ts` — update `create`, `list`, `createVendorTask`, and `createPayment` to use Mongoose models when `hasMongoConnection` is true; keep the in-memory fallback for local development
- Acceptance criteria:
  - When MongoDB is connected, orders created through the API are persisted in Atlas
  - When MongoDB is not connected, the in-memory mock store is used as before
  - Mongoose model field types match the `@asur/types` `Order`, `Payment`, and `VendorTask` interfaces exactly

---

### S4-T2 — Filter orders by customer in the backend

- Status: `TODO`
- Files to create / edit:
  - `apps/backend/src/repositories/order.repository.ts` — add `listByCustomer(customerId: string)` method; when using Mongo, query `{ customerId }`; add `findById(id: string)` method
  - `apps/backend/src/services/order.service.ts` — add `listOrdersByCustomer(customerId)` and `getOrderById(id)` service functions
  - `apps/backend/src/controllers/order.controller.ts` — update `listOrdersController` to call `listOrdersByCustomer(req.user.id)` so each customer only sees their own orders; update `getOrderController` to call `getOrderById(req.params.id)` and return 404 if not found or not owned by the requesting user
- Acceptance criteria:
  - `GET /api/v1/orders` returns only orders belonging to the authenticated user
  - `GET /api/v1/orders/:id` returns 404 if the order belongs to a different user
  - Unauthenticated requests to both routes return 401

---

### S4-T3 — Build the order history page

- Status: `TODO`
- Files to create / edit:
  - `apps/web/app/orders/page.tsx` — replace placeholder; fetch `GET /api/v1/orders`; render a list of order cards showing order number, date, status badge, item count, and total; link each card to `/orders/[id]`; show empty state with "Start shopping" CTA when no orders; guard with auth redirect to `/auth?next=/orders`
  - `apps/web/components/order-card.tsx` — create; receives `Order`; renders compact card with order number, date, status (color-coded badge), and total
- Acceptance criteria:
  - Orders list shows real data from the backend
  - Each order status has a distinct color badge (pending = amber, paid = blue, shipped = green, etc.)
  - Empty state is shown when the user has no orders
  - Page redirects to auth if not signed in
- Mobile spec:
  - Each order card is a full-width row, easy to tap
  - Order number and status are visible at a glance without horizontal scroll

---

### S4-T4 — Build the order detail and tracking page

- Status: `TODO`
- Files to create / edit:
  - `apps/web/app/orders/[id]/page.tsx` — create; fetch `GET /api/v1/orders/:id`; render full order: items, quantities, unit prices, line totals, shipping address, payment status, fulfillment status, order timeline; show tracking ID and courier if available on the linked vendor task
  - `apps/web/components/order-timeline.tsx` — create; renders a vertical timeline of order lifecycle steps: `Placed → Payment Confirmed → Processing → Packed → Shipped → Delivered`; marks the current step as active and past steps as completed; grays out future steps
- Acceptance criteria:
  - Order detail shows all items with correct totals
  - Timeline accurately reflects the current order status
  - Tracking info (courier, tracking ID) appears when available
  - Page returns 404 UI if order ID is invalid
- Mobile spec:
  - Timeline is a vertical stack, readable at 390px
  - Item list stacks vertically (no side-by-side columns on mobile)

---

### S4-T5 — Build the account profile page

- Status: `TODO`
- Files to create / edit:
  - `apps/web/app/account/page.tsx` — replace placeholder; show user name, email, and linked providers from `useAuthStore` session; list saved addresses with an "Add address" link; link to `/orders` for order history; show "Sign out" button
  - `apps/web/components/address-list.tsx` — create; fetches `GET /api/v1/auth/addresses`; renders each address as a card with name, phone, city, and pincode; add "Set as default" toggle (stretch goal)
- Acceptance criteria:
  - Account page shows real user info from the session
  - Saved addresses are loaded from the backend
  - Sign out clears the session and redirects to `/`

---

## Sprint 5 — Payment Verification and Order Status Updates

**Goal:** Razorpay payment verification correctly updates the order status in MongoDB. The paid order triggers a vendor task.

---

### S5-T1 — Wire payment verification to order status update

- Status: `TODO`
- Files to create / edit:
  - `apps/backend/src/controllers/payment.controller.ts` — update `verifyPaymentController`: after signature verification succeeds, call `orderRepository.updateStatus(orderId, "paid")` and `orderRepository.updatePaymentStatus(orderId, "captured")`
  - `apps/backend/src/repositories/order.repository.ts` — add `updateStatus(id, status)` and `updatePaymentStatus(id, paymentStatus)` methods using Mongoose `findOneAndUpdate` when connected, or mock store mutation when not
  - `apps/backend/src/services/order.service.ts` — add `markOrderPaid(orderId)` that calls both updates and then calls `orderRepository.createVendorTask(orderId)` if no task exists yet
- Acceptance criteria:
  - After payment verification, the order's `status` is `"paid"` and `paymentStatus` is `"captured"` in the database
  - A vendor task is created for every paid order
  - The verification endpoint returns the updated order in its response body

---

### S5-T2 — Add Razorpay order ID to the order record

- Status: `TODO`
- Files to create / edit:
  - `apps/backend/src/models/order.model.ts` — add `providerOrderId?: string` field to the schema
  - `apps/backend/src/repositories/order.repository.ts` — update `create` to accept `providerOrderId` in its input and persist it
  - `apps/backend/src/controllers/payment.controller.ts` — after creating the Razorpay order, store `providerOrderId` back on the order using `orderRepository.updateProviderOrderId(orderId, razorpayOrder.id)`; add `updateProviderOrderId` to the repository
- Acceptance criteria:
  - The `providerOrderId` field on the order matches the Razorpay order ID
  - The frontend uses this `providerOrderId` when opening the Razorpay modal

---

## Sprint 6 — Admin Control Plane

**Goal:** Admin panel lets a super admin manage products, view orders, and monitor store state. No code change is needed to update the catalog or pricing.

---

### S6-T1 — Admin navigation layout (sidebar)

- Status: `TODO`
- Files to create / edit:
  - `apps/admin/app/layout.tsx` — add a fixed sidebar with links: Dashboard, Products, Orders, Collections, Content, Settings; show user role badge; show "Sign out" button; make sidebar collapsible on tablet
  - `apps/admin/app/globals.css` — add sidebar layout styles; sidebar is 240px wide on desktop, hidden by default on tablet with a toggle button
- Acceptance criteria:
  - Admin can navigate between all sections from the sidebar
  - Sidebar collapses cleanly on laptop screens
  - Current active route is highlighted in the sidebar

---

### S6-T2 — Admin product list with real API data

- Status: `TODO`
- Files to create / edit:
  - `apps/admin/app/products/page.tsx` — create; fetch `GET /api/v1/admin/products` (need to add this route); render a table with: title, SKU count, status badge, stock total, price range, last updated; add "New product" button; add filters for status (draft / active / archived)
  - `apps/backend/src/controllers/admin.controller.ts` — add `listAdminProductsController` that returns all products (including drafts) with variant summary; guard with `requireAdmin` middleware
  - `apps/backend/src/routes/admin.routes.ts` — add `GET /products` route
- Acceptance criteria:
  - Admin sees all products including drafts
  - Table shows status, stock, and price range at a glance
  - "New product" button routes to the create form

---

### S6-T3 — Admin product create and edit form

- Status: `TODO`
- Files to create / edit:
  - `apps/admin/app/products/new/page.tsx` — create; form fields: title, slug (auto-generated from title), description, category, fit, status, collection slugs, tags; submit calls `POST /api/v1/admin/products`
  - `apps/admin/app/products/[id]/page.tsx` — create; fetch product by ID; same form pre-filled; submit calls `PATCH /api/v1/admin/products/:id`
  - `apps/admin/components/variant-editor.tsx` — create; lets admin add/remove/edit variants (size, color, SKU, price, compareAtPrice, stock); renders as an editable table or card list
  - `apps/backend/src/controllers/admin.controller.ts` — add `createProductController` and `updateProductController`; validate with `createProductSchema` and `updateProductSchema` from `@asur/validations`; guard with `requireAdmin` and `catalog:write` permission
  - `apps/backend/src/routes/admin.routes.ts` — add `POST /products`, `PATCH /products/:id`, `DELETE /products/:id`
- Acceptance criteria:
  - Admin can create a product with at least one variant and see it appear on the storefront products page
  - Admin can edit title, description, price, stock, and publish status
  - Form validation errors are inline and actionable

---

### S6-T4 — Admin order monitoring

- Status: `TODO`
- Files to create / edit:
  - `apps/admin/app/orders/page.tsx` — create; fetch `GET /api/v1/admin/orders`; render table: order number, customer name, status, payment status, fulfillment status, total, date; add filter tabs: All, Paid, Processing, Shipped
  - `apps/admin/app/orders/[id]/page.tsx` — create; show full order details plus fulfillment task status; show "Mark as processing" / action buttons
  - `apps/backend/src/controllers/admin.controller.ts` — add `listAdminOrdersController` (returns all orders, not filtered by customer); add `getAdminOrderController`; guard with `requireAdmin` and `orders:read` permission
  - `apps/backend/src/routes/admin.routes.ts` — add `GET /orders`, `GET /orders/:id`
- Acceptance criteria:
  - Admin sees all orders across all customers
  - Order detail shows payment and fulfillment status

---

## Sprint 7 — Vendor Fulfillment

**Goal:** Vendor can log in to the vendor app, view assigned tasks, and update fulfillment status (mark packed, upload tracking, mark shipped).

---

### S7-T1 — Vendor task list

- Status: `TODO`
- Files to create / edit:
  - `apps/vendor/app/tasks/page.tsx` — create; fetch `GET /api/v1/vendor/tasks`; render task cards: order number, customer shipping address, items to pack, current status; filter by status: pending, in_progress, ready_to_ship
  - `apps/backend/src/controllers/vendor.controller.ts` — create; `listVendorTasksController` returns tasks filtered by `req.user.id` if a vendor ID is assigned, or all unassigned tasks for admin vendors
  - `apps/backend/src/routes/vendor.routes.ts` — create; mount `GET /tasks`, `PATCH /tasks/:id`; guard with `requireVendor` middleware
  - `apps/backend/src/routes/index.ts` — mount `/api/v1/vendor` router
- Acceptance criteria:
  - Vendor sees tasks assigned to them (or all unassigned tasks)
  - Task card shows what needs to be packed and where to ship

---

### S7-T2 — Vendor task status update and tracking upload

- Status: `TODO`
- Files to create / edit:
  - `apps/vendor/app/tasks/[id]/page.tsx` — create; show task detail with order items, shipping address, current status; show action buttons: "Mark packed", "Mark shipped" (requires tracking ID + courier name); show a form to enter tracking ID and courier name before marking shipped
  - `apps/backend/src/controllers/vendor.controller.ts` — add `updateVendorTaskController`; accepts `status`, `trackingId`, `courierName`, `notes`; validates transition rules (can only move forward in status); when marked shipped, update the parent order's `fulfillmentStatus` to `"shipped"`
  - `apps/backend/src/repositories/order.repository.ts` — add `updateVendorTask(taskId, updates)` method
- Acceptance criteria:
  - Vendor can move a task from pending → in_progress → ready_to_ship → shipped
  - Tracking ID and courier name are required before marking shipped
  - Order `fulfillmentStatus` updates automatically when task is marked shipped
  - Customer's order detail page shows the tracking info after vendor updates it

---

## Sprint 8 — Launch Hardening

**Goal:** Performance, observability, and QA before first real orders.

---

### S8-T1 — Error handling and loading states across web

- Status: `TODO`
- Files to create / edit:
  - All web page files that make API calls — wrap each `api.get()` / `api.post()` with try/catch; show a reusable `<ErrorBanner>` component on failure; show skeleton loaders during fetch instead of empty screens
  - `apps/web/components/error-banner.tsx` — create; receives `message` and optional `retry` callback; styled with warning colors
  - `apps/web/components/skeleton.tsx` — create; returns a shimmer placeholder block; used in product card, order card, and cart
- Acceptance criteria:
  - Every API call has a loading state and an error state
  - Network failures never show a blank white screen

---

### S8-T2 — Mobile checkout QA pass

- Status: `TODO`
- Scope:
  - Test the full flow on a 390×844 viewport (iPhone 14 size) in Chrome DevTools
  - Verify every step of the checkout wizard renders without overflow
  - Verify input keyboard types are correct (tel for phone, numeric for pincode, email for email)
  - Verify "Confirm & Pay" button is visible above the soft keyboard on iOS-like layouts
  - Verify Razorpay modal opens and closes correctly
  - Verify cart clears after confirmation
- Acceptance criteria:
  - End-to-end checkout completes without scroll, overflow, or UX blockers on 390px
  - No console errors during the full flow

---

### S8-T3 — Analytics funnel events

- Status: `TODO`
- Files to create / edit:
  - `apps/web/lib/analytics.ts` — create; export `track(event: string, props?: Record<string, unknown>)` wrapper around a lightweight analytics call (can use `console.log` as a no-op placeholder initially, or wire to a real provider)
  - Call sites: `apps/web/app/products/[slug]/page.tsx` (product_viewed), `apps/web/store/cart-store.ts` addItem (add_to_cart), `apps/web/app/checkout/page.tsx` step entries (checkout_started, checkout_address_complete, checkout_review_complete), `apps/web/lib/razorpay.ts` onSuccess (payment_success, payment_failed)
- Acceptance criteria:
  - All five funnel events fire at the correct moments
  - No events fire on server-side render (client-only)

---

### S8-T4 — Image delivery with Cloudflare R2 and Next.js Image

- Status: `TODO`
- Files to create / edit:
  - `apps/web/next.config.mjs` — add `images.remotePatterns` for the R2 public domain
  - `apps/web/components/product-image-gallery.tsx` — replace `<img>` with `<Image>` from `next/image`; use `sizes` prop for responsive delivery; keep the gradient placeholder when `product.media` is empty
  - `apps/backend` (existing upload utilities) — verify R2 upload works and returns a public URL in the expected format for `MediaAsset.url`
- Acceptance criteria:
  - Product images load from R2 with proper caching headers
  - Next.js Image component is used so images are resized per viewport
  - No layout shift during image load (use `fill` or explicit width/height)

---

## Recommended Execution Order

1. Sprint 1 (real storefront — start here, highest customer impact)
2. Sprint 2 (real cart — customers need to be able to add items)
3. Sprint 3 (auth gate + checkout — the money flow)
4. Sprint 4 (order persistence + history — trust and retention)
5. Sprint 5 (payment verification + order status — correctness)
6. Sprint 6 (admin control plane — catalog management)
7. Sprint 7 (vendor fulfillment — operational readiness)
8. Sprint 8 (launch hardening — polish and QA)

## Notes for Picking Up Tasks

- Each ticket lists the exact files to create or edit — start there.
- Mark a ticket `IN PROGRESS` before starting; mark `DONE` only after testing in the browser.
- Mobile usability is the default lens for every customer-facing ticket: test at 390px width before marking done.
- The backend gracefully falls back to the in-memory mock store when `MONGODB_URI` is not set — use this for local dev without Docker.
- Sprint 3 (checkout) is the highest-value sprint: finishing it unlocks real transactions.
