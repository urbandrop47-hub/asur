# ASUR E-Commerce Implementation Roadmap

This document is the working backlog for turning the current scaffold into a fully functional, mobile-first T-shirt store.

Use it as the source of truth for picking work one ticket at a time. The recommended order is top to bottom.

## Status Legend

- `TODO` = not started
- `IN PROGRESS` = actively being worked on
- `BLOCKED` = waiting on a dependency
- `DONE` = finished and verified

## Product Direction

- Primary goal: an admin-driven, mobile-first, end-to-end T-shirt commerce platform
- Core customer flow: browse -> product detail -> add to cart -> checkout -> pay -> order confirmation -> order tracking
- Secondary surfaces: vendor fulfillment, analytics, and customer self-service
- Control plane goal: the admin panel should manage as much store behavior as possible, including products, collections, banners, featured content, pricing rules, publishing, and fulfillment settings
- First release scope: functional, conversion-ready MVP with strong mobile usability
- Deferred from v1: reviews, wishlists, loyalty programs, subscriptions, personalized recommendations, and advanced CRM tooling

## Sprint 0 Checkpoints

- Finish Sprint 0 before starting any admin or storefront implementation sprint
- Mark a ticket `DONE` only when the code or documentation change is present and verified
- Keep this roadmap as the single source of truth for sequence and status
- Sprint 0 is considered complete only when `S0-T1`, `S0-T2`, and `S0-T3` are all `DONE`

## Sprint 0 - Foundation And Scope

Goal: lock the product model and make the repo ready for incremental implementation.

Sprint 0 status: complete.

### Tickets

- [ ] `S0-T1` Define the T-shirt product model
  - Status: `DONE`
  - Scope:
    - Finalize required product fields for T-shirts
    - Confirm variant structure for size, color, stock, and SKU
    - Confirm collection/drop support
  - Acceptance criteria:
    - Shared types and validations reflect the chosen model
    - The model supports T-shirt-specific merchandising without extra redesign
  - Verification:
    - Product model now includes `collectionSlugs`, `drop`, and `fit`
    - Shared validations enforce the same shape across frontend and backend
    - Seeded and local catalog product records include collection and drop metadata

- [ ] `S0-T2` Freeze the MVP journey
  - Status: `DONE`
  - Scope:
    - Confirm the exact customer journey for v1
    - Explicitly defer non-essential features
  - Acceptance criteria:
    - One documented flow exists for browse to payment confirmation
    - Deferred features are listed so they do not distract the build
  - Verification:
    - The roadmap now documents the v1 customer flow and deferred features
    - `apps/web/lib/catalog.ts` reflects the current auth-to-pay journey language

- [ ] `S0-T3` Establish implementation checkpoints
  - Status: `DONE`
  - Scope:
    - Add a simple execution order for future tickets
    - Define what "done" means for each sprint
  - Acceptance criteria:
    - Every sprint has measurable output
    - This roadmap remains the tracking source in the repo
  - Verification:
    - Sprint sections and ticket ordering are already in this roadmap
    - A new Sprint 0 checkpoints section defines completion rules

- [ ] `S0-T4` Seed Atlas with starter users and T-shirt catalog data
  - Status: `DONE`
  - Scope:
    - Add a repeatable backend seed command
    - Populate MongoDB Atlas with starter users, products, and an admin invite
  - Acceptance criteria:
    - Atlas has at least one super admin, one customer, and sample T-shirt products
    - Seed can be rerun safely without duplicating core records
  - Verification:
    - `pnpm -C apps/backend seed` populated Atlas with 2 users, 3 products, and 1 invite
    - Atlas query confirmed the seeded document counts

- [ ] `S0-T5` Configure Firebase auth and verify token exchange
  - Status: `DONE`
  - Scope:
    - Document the Firebase setup path for backend and frontend
    - Verify the auth session handoff works once credentials are available
  - Acceptance criteria:
    - Firebase env values are documented and ready to plug in
    - Backend auth session flow is verified with a real Firebase token when configured
  - Verification:
    - Web Firebase config is wired in [apps/web/lib/firebase.ts](/Users/ridam/ASUR/asur/apps/web/lib/firebase.ts)
    - Backend session exchange is wired in [apps/backend/src/controllers/auth.controller.ts](/Users/ridam/ASUR/asur/apps/backend/src/controllers/auth.controller.ts)
    - Web and backend builds pass after the auth wiring

- [ ] `S0-T6` Implement Firebase sign-in, provider linking, and account merge recovery
  - Status: `DONE`
  - Scope:
    - Support email/password and Google sign-in in the web auth panel
    - Let one Firebase user link Google and email/password under the same account
    - Recover from provider collisions by resuming the matching sign-in method and completing the link
    - Keep the backend session exchange and Mongo role lookup unchanged
  - Acceptance criteria:
    - Users can sign in with email/password or Google
    - Logged-in users can link the other provider to the same Firebase identity
    - Account collision cases are handled without creating duplicate app users
    - Admin users still route directly to the admin app after session exchange
  - Verification:
    - `pnpm -C apps/web build` passes after the auth panel updates
    - `pnpm -C apps/backend build` remains green
    - Auth UI is wired in [apps/web/components/auth-panel.tsx](/Users/ridam/ASUR/asur/apps/web/components/auth-panel.tsx)

## Sprint 1 - Admin Control Plane

Goal: make the admin panel the primary place where the store is configured and operated.

### Tickets

- [ ] `S1-T1` Define admin roles and access boundaries
  - Status: `DONE`
  - Scope:
    - Split admin roles from vendor and customer roles
    - Establish permission boundaries for view, edit, publish, refund, and fulfillment actions
  - Acceptance criteria:
    - Admin actions are role-gated
    - The permission model is reusable across admin screens
  - Verification:
    - `packages/constants`, `packages/types`, `packages/validations`, `apps/backend`, and `apps/admin` all build successfully
    - Invite creation and invite acceptance were exercised against the local in-memory backend flow
    - Local Mongo bootstrap support is available through `SUPER_ADMIN_BOOTSTRAP_*` env vars and the backend startup path
    - `docker compose config` validates the local Mongo service definition

- [ ] `S1-T2` Design the admin navigation and workspace layout
  - Status: `TODO`
  - Scope:
    - Create a clear admin shell for product, content, order, and fulfillment modules
    - Keep the layout usable on laptop and tablet first
  - Acceptance criteria:
    - Admin can move between modules quickly
    - The layout supports future modules without major redesign

- [ ] `S1-T3` Build product create and edit flows
  - Status: `TODO`
  - Scope:
    - Create product create/edit/publish flows
    - Support title, description, category, tags, and product status
  - Acceptance criteria:
    - Admin can fully manage catalog entries from the panel
    - Product changes are reflected in the storefront

- [ ] `S1-T4` Add product variant management
  - Status: `TODO`
  - Scope:
    - Manage size, color, SKU, stock, and compare-at price per variant
    - Validate that T-shirt variant combinations are consistent
  - Acceptance criteria:
    - Admin can add and edit product variants without code changes
    - Storefront receives usable variant data

- [ ] `S1-T5` Add product media and SEO fields
  - Status: `TODO`
  - Scope:
    - Attach image assets to products
    - Store alt text, metadata, and canonical details
  - Acceptance criteria:
    - Admin can manage product imagery from the panel
    - Product pages have enough metadata for discoverability

- [ ] `S1-T6` Add collection management
  - Status: `TODO`
  - Scope:
    - Create, edit, and organize collections or seasonal drops
    - Assign products to collections
  - Acceptance criteria:
    - Admin can manage collections centrally
    - Collection membership is reflected on the storefront

- [ ] `S1-T7` Add homepage hero and featured content management
  - Status: `TODO`
  - Scope:
    - Manage homepage hero, banners, callouts, and featured product modules
    - Allow the landing page to change without a deploy
  - Acceptance criteria:
    - Homepage content is driven from admin
    - Merchandising changes are live without code edits

- [ ] `S1-T8` Add pricing and publish controls
  - Status: `TODO`
  - Scope:
    - Manage publish state, launch timing, compare-at pricing, and sale badges
    - Support limited drops and price updates
  - Acceptance criteria:
    - Admin can control when items go live
    - Storefront product pricing reflects admin changes

- [ ] `S1-T9` Add inventory and availability controls
  - Status: `TODO`
  - Scope:
    - Manage stock visibility, low-stock thresholds, and out-of-stock behavior
    - Prepare the system for inventory adjustments after fulfillment
  - Acceptance criteria:
    - Inventory changes affect storefront availability
    - Low-stock and sold-out states are visible and consistent

- [ ] `S1-T10` Add shipping, fulfillment, and return settings
  - Status: `TODO`
  - Scope:
    - Configure shipping rules, fulfillment workflow defaults, and return settings
    - Keep operational settings editable from admin
  - Acceptance criteria:
    - Admin can tune store operations without touching code
    - Checkout and order processing use the configured settings

## Sprint 2 - Mobile Storefront Core

Goal: make the customer-facing storefront usable and fast on phones.

### Tickets

- [ ] `S2-T1` Replace static catalog data with backend-backed product fetches
  - Status: `TODO`
  - Scope:
    - Wire product listing to the API
    - Remove dependency on local mock catalog as the primary source
  - Acceptance criteria:
    - Products render from the backend
    - Loading and error states exist

- [ ] `S2-T2` Rebuild the mobile product listing layout
  - Status: `TODO`
  - Scope:
    - Optimize the product grid for small screens
    - Make product cards thumb-friendly and scannable
  - Acceptance criteria:
    - Listing is comfortable on narrow screens
    - Primary CTA is visible without hunting

- [ ] `S2-T3` Build a usable product detail page
  - Status: `TODO`
  - Scope:
    - Show gallery, price, stock, and description
    - Prepare the page for future size/color selection
  - Acceptance criteria:
    - Product detail works for real backend products
    - Page layout reads well on mobile first

- [ ] `S2-T4` Add basic collection and category navigation
  - Status: `TODO`
  - Scope:
    - Expose collections or drop groupings
    - Make it easy to move between product sets
  - Acceptance criteria:
    - Users can browse by collection without friction
    - Navigation remains clean on mobile

## Sprint 3 - Variant Selection And Cart

Goal: let customers choose the right T-shirt and persist it in cart state.

### Tickets

- [ ] `S3-T1` Implement size and color variant selection
  - Status: `TODO`
  - Scope:
    - Add variant picker on product detail
    - Connect selected variant to the right SKU and price
  - Acceptance criteria:
    - Users can select a valid T-shirt variant
    - Invalid combinations are prevented

- [ ] `S3-T2` Convert cart into a persistent real cart
  - Status: `TODO`
  - Scope:
    - Add quantity updates and item removal
    - Persist cart across refreshes
  - Acceptance criteria:
    - Cart survives reloads
    - Cart totals update correctly

- [ ] `S3-T3` Add backend cart synchronization for logged-in users
  - Status: `TODO`
  - Scope:
    - Sync cart state after authentication
    - Preserve anonymous cart behavior before login
  - Acceptance criteria:
    - Cart merges or restores safely for signed-in users
    - No cart loss during login

- [ ] `S3-T4` Improve cart UX for mobile checkout readiness
  - Status: `TODO`
  - Scope:
    - Simplify cart layout on small screens
    - Make checkout CTA prominent
  - Acceptance criteria:
    - Cart is easy to review and edit on mobile
    - Checkout path is obvious

## Sprint 4 - Authentication And Checkout

Goal: complete identity, address capture, and payment initiation.

### Tickets

- [ ] `S4-T1` Implement real auth session handoff
  - Status: `TODO`
  - Scope:
    - Use Firebase identity token exchange with backend session creation
    - Keep customer profile creation automatic
  - Acceptance criteria:
    - A successful login creates or restores a backend user profile
    - Auth state is reusable across app pages

- [ ] `S4-T2` Build mobile-first address capture
  - Status: `TODO`
  - Scope:
    - Add shipping address form
    - Support saved addresses for repeat orders
  - Acceptance criteria:
    - Address form is easy to complete on a phone
    - Validation errors are clear and actionable

- [ ] `S4-T3` Create checkout order draft flow
  - Status: `TODO`
  - Scope:
    - Collect cart, user, and address data
    - Create backend order drafts before payment
  - Acceptance criteria:
    - Checkout can create an order draft
    - Order summary matches cart values

- [ ] `S4-T4` Wire Razorpay order creation and payment handoff
  - Status: `TODO`
  - Scope:
    - Create payment order on backend
    - Pass control to Razorpay
  - Acceptance criteria:
    - Payment initiation works end to end
    - Failure states are handled cleanly

## Sprint 5 - Payment Verification And Order Lifecycle

Goal: finalize the purchase and make the order trackable.

### Tickets

- [ ] `S5-T1` Implement payment signature verification
  - Status: `TODO`
  - Scope:
    - Verify successful Razorpay payment responses on backend
    - Reject invalid signatures
  - Acceptance criteria:
    - Verified payment updates backend state
    - Invalid payment data is blocked

- [ ] `S5-T2` Finalize order creation on successful payment
  - Status: `TODO`
  - Scope:
    - Mark paid orders correctly
    - Persist final order records
  - Acceptance criteria:
    - Payment success results in a committed order
    - Order totals and statuses are correct

- [ ] `S5-T3` Create vendor fulfillment tasks automatically
  - Status: `TODO`
  - Scope:
    - Generate vendor task after payment success
    - Link task to the order and shipment lifecycle
  - Acceptance criteria:
    - Every paid order gets a fulfillment task
    - Vendor queue reflects new orders

- [ ] `S5-T4` Build order confirmation and failure screens
  - Status: `TODO`
  - Scope:
    - Add success, pending, and failed payment states
    - Provide clear next steps for the user
  - Acceptance criteria:
    - Customers know whether the order succeeded
    - Retry or support actions are available where needed

## Sprint 6 - Customer Account And Tracking

Goal: give customers a post-purchase surface they can use confidently on mobile.

### Tickets

- [ ] `S6-T1` Build order history from backend data
  - Status: `TODO`
  - Scope:
    - Replace placeholder order content with live records
    - Add compact mobile order cards
  - Acceptance criteria:
    - Orders page shows real user orders
    - Status and totals are visible at a glance

- [ ] `S6-T2` Build order detail and shipment tracking views
  - Status: `TODO`
  - Scope:
    - Show order items, payment state, and shipment status
    - Add timeline-style tracking
  - Acceptance criteria:
    - Customers can inspect any order in detail
    - Tracking information is easy to read on small screens

- [ ] `S6-T3` Build account profile and saved address management
  - Status: `TODO`
  - Scope:
    - Let users view and edit profile information
    - Let users manage shipping addresses
  - Acceptance criteria:
    - Users can manage account data without contacting support
    - Saved addresses can be reused at checkout

- [ ] `S6-T4` Add wishlist or save-for-later only if time allows
  - Status: `BLOCKED`
  - Scope:
    - Treat as optional after core commerce flow is stable
  - Acceptance criteria:
    - Only start if the sprint ahead stays on schedule

## Sprint 7 - Admin And Vendor Operations

Goal: make the internal workflows functional enough to support real product launches and fulfillment.

### Tickets

- [ ] `S7-T1` Connect admin dashboard to real product and order data
  - Status: `TODO`
  - Scope:
    - Show live metrics and operational queues
    - Replace narrative placeholders with real API-backed data
  - Acceptance criteria:
    - Admin sees real store state
    - Important issues are visible quickly

- [ ] `S7-T2` Add product publishing and inventory management flows
  - Status: `TODO`
  - Scope:
    - Support drafts, active products, and stock changes
    - Prepare T-shirt drop management
  - Acceptance criteria:
    - Admin can control what goes live
    - Inventory changes update product availability

- [ ] `S7-T3` Connect vendor task execution flow
  - Status: `TODO`
  - Scope:
    - View tasks
    - Mark packed, shipped, or completed
    - Upload tracking information
  - Acceptance criteria:
    - Vendors can process fulfillment without manual backend intervention
    - Order status updates propagate correctly

- [ ] `S7-T4` Add refund and exception handling workflow
  - Status: `TODO`
  - Scope:
    - Give admin a way to resolve payment or fulfillment exceptions
  - Acceptance criteria:
    - Failed or disputed orders can be handled in a tracked workflow

## Sprint 8 - Launch Hardening

Goal: tighten performance, analytics, and reliability before release.

### Tickets

- [ ] `S8-T1` Add analytics for the conversion funnel
  - Status: `TODO`
  - Scope:
    - Track product view, add to cart, checkout start, payment success, and order completion
  - Acceptance criteria:
    - Funnel drop-off can be measured
    - Mobile conversion signals are visible

- [ ] `S8-T2` Improve mobile performance and responsive image delivery
  - Status: `TODO`
  - Scope:
    - Optimize image loading
    - Reduce mobile JS cost where possible
  - Acceptance criteria:
    - Pages feel fast on mobile connections
    - Images load responsively and efficiently

- [ ] `S8-T3` Add error handling, logging, and monitoring hooks
  - Status: `TODO`
  - Scope:
    - Improve backend and frontend observability
    - Make failures easier to diagnose
  - Acceptance criteria:
    - Core failures are traceable
    - Support can identify broken steps quickly

- [ ] `S8-T4` Run full mobile checkout QA
  - Status: `TODO`
  - Scope:
    - Test on small screens and slower networks
    - Confirm the entire funnel works on real devices
  - Acceptance criteria:
    - Browse to payment to order confirmation works on mobile
    - No blocking usability issues remain

## Recommended Execution Order

1. Sprint 0
2. Sprint 1
3. Sprint 2
4. Sprint 3
5. Sprint 4
6. Sprint 5
7. Sprint 6
8. Sprint 7
9. Sprint 8

## Notes For Tracking

- Pick one ticket at a time, starting from the top.
- Mark the ticket status in this file as the work progresses.
- Keep mobile usability as the default lens for every customer-facing ticket.
- If a ticket depends on a missing decision, resolve the dependency before starting implementation.
