# ASUR — Business Flow Diagrams

> All diagrams use [Mermaid](https://mermaid.js.org/) syntax — renders on GitHub, VS Code (Mermaid extension), Notion, and most modern docs tools.

---

## 1. Customer Purchase Journey (Happy Path)

```mermaid
flowchart TD
    A([Customer visits weareasur.in]) --> B[Browse products / collections]
    B --> C{Finds product}
    C -->|PDP| D[Selects size + color]
    D --> E{Variant in stock?}
    E -->|Yes| F[Add to cart OR Buy Now]
    E -->|No| G[Back-in-stock email signup]
    E -->|Pre-order| H[Pre-order now → checkout]
    F --> I[Cart page — review items]
    H --> I
    I --> J{Logged in?}
    J -->|No| K[Sign in / register via Firebase]
    K --> I
    J -->|Yes| L[Checkout — Step 1: Address]
    L --> L1[Pincode autofill — India Post API]
    L1 --> L2[Validate + save address]
    L2 --> M[Step 2: Review order]
    M --> M1{Apply coupon?}
    M1 -->|Yes| M2[Validate coupon → discount applied]
    M1 -->|No| M3
    M2 --> M3{Apply gift card?}
    M3 -->|Yes| M4[Validate gift card → deduct balance]
    M3 -->|No| M5
    M4 --> M5{Redeem loyalty points?}
    M5 -->|Yes| M6[Deduct up to 20% of order]
    M5 -->|No| M7[Place order button]
    M6 --> M7
    M7 --> N[Backend: create Order document]
    N --> O{Total = 0?}
    O -->|Yes — fully covered by GC/loyalty| P[Order confirmed — skip Razorpay]
    O -->|No| Q[Create Razorpay payment order]
    Q --> R[Razorpay modal opens]
    R --> S{Payment result}
    S -->|Success| T[Backend: verify Razorpay signature]
    S -->|Dismissed| U[Return to review step — retry available]
    T --> V[Order status: paid]
    P --> V
    V --> W[Confirmation page + emails sent]
    W --> X[Stock decremented atomically]
    X --> Y[Loyalty points earned]
    Y --> Z[Referral code rewarded if used]
```

---

## 2. Order Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> draft : Order created (system)
    draft --> pending_payment : Payment order created
    pending_payment --> paid : Razorpay payment verified
    pending_payment --> cancelled : Payment abandoned / timeout
    paid --> processing : Admin assigns to vendor
    processing --> packed : Vendor marks packed
    packed --> shipped : Admin adds tracking number
    shipped --> delivered : Marked delivered
    delivered --> [*] : Terminal ✓
    
    processing --> cancelled : Admin cancels
    packed --> cancelled : Admin cancels
    shipped --> cancelled : Admin cancels (rare)
    
    delivered --> return_requested : Customer requests return (≤7 days)
    return_requested --> return_approved : Admin approves
    return_approved --> refunded : Razorpay refund issued
    return_requested --> return_rejected : Admin rejects
```

---

## 3. Admin Order Management Flow

```mermaid
flowchart TD
    A[New order arrives] --> B[Admin dashboard — SSE real-time feed]
    B --> C[Order Kanban — drag column to update status]
    C --> D{Action needed}
    D -->|Assign| E[Admin: create vendor task]
    E --> F[Vendor portal notified]
    F --> G{Vendor actions}
    G -->|Accepts| H[Vendor: mark packed]
    G -->|Needs help| I[Add note to task]
    H --> J[Admin: adds tracking number + courier]
    J --> K[Order → shipped status]
    K --> L[Shipping email → customer with tracking URL]
    L --> M[Customer tracks via /track page — no login]
    M --> N{Delivered?}
    N -->|Yes| O[Admin marks delivered]
    O --> P[Review request email — 7 days later]
    N -->|Issue reported| Q[Return request submitted]
    Q --> R[Admin reviews in Returns queue]
    R -->|Approve| S[Razorpay refund issued]
    R -->|Reject| T[Email sent to customer]
```

---

## 4. Inventory Management Flow

```mermaid
flowchart LR
    A[Admin creates product + variants] --> B[Each variant has stock count]
    
    B --> C{Stock event}
    C -->|Order paid| D["$inc: -quantity with $gte: 0 guard"]
    C -->|Admin adjusts| E[Bulk CSV upload OR manual edit]
    C -->|Return approved| F["$inc: +quantity restored"]
    
    D --> G{Stock level check}
    G -->|stock ≤ 5| H[Low-stock alert email to admin]
    G -->|stock = 0| I[Variant marked out-of-stock on PDP]
    I --> J[Back-in-stock signup form shown]
    
    E --> K[Stock updated]
    F --> K
    K --> L{Was previously OOS?}
    L -->|Yes + signup exists| M[Back-in-stock email to subscribers]
    
    B --> N[Live stock SSE — /api/v1/products/:slug/stock-stream]
    N --> O[PDP shows LIVE badge + real-time stock count]
```

---

## 5. Customer Retention Flow (Email & Loyalty)

```mermaid
flowchart TD
    A[Customer places order] --> B[Order confirmation email]
    B --> C[Payment receipt email]
    
    C --> D{Order shipped?}
    D -->|Yes| E[Shipping update email with tracking link]
    
    E --> F{Delivered?}
    F -->|Yes 7 days later| G[Review request email — links to product PDP]
    
    A --> H[Loyalty points earned — 1 pt per ₹10]
    H --> I{Tier upgrade?}
    I -->|Bronze → Silver → Gold| J[Tier badge shown on account page]
    
    subgraph Abandoned Cart Recovery
        K[Customer adds to cart but leaves checkout] --> L[Sync to abandoned_carts collection]
        L --> M{1 hour passes?}
        M -->|Yes + not purchased| N[Recovery email #1 — no discount]
        N --> O{24 hours pass?}
        O -->|Yes + still not purchased| P[Recovery email #2 — 5% coupon generated]
        P --> Q{Cart converted?}
        Q -->|Yes| R[Mark converted — stop emails]
    end
    
    subgraph Newsletter
        S[Exit-intent popup OR footer form] --> T[Subscriber clicks confirm email]
        T --> U[Added to newsletter list]
        U --> V[Admin sends campaign to segment]
    end
```

---

## 6. Referral & Loyalty Points Flow

```mermaid
flowchart TD
    A[New customer registers] --> B{Has referral code in cookie?}
    B -->|Yes /r/:code| C[Referral tracked on order]
    B -->|No| D[Normal order]
    
    C --> E{Order paid?}
    E -->|Yes| F[Referee earns bonus points]
    F --> G[Referrer earns bonus points]
    
    D --> H[Earn 1 pt per ₹10 spent]
    G --> H
    
    H --> I[Points balance in loyalty_accounts collection]
    I --> J{Checkout — redeem points?}
    J -->|Yes — toggle on| K[Redeem up to 20% of order value]
    K --> L[Points deducted — saved to order.loyaltyPointsRedeemed]
    L --> M[Discount applied to total]
    
    J -->|Order cancelled?| N[Points restored via service]
    
    I --> O{Tier thresholds}
    O -->|0–999 pts| P[Bronze]
    O -->|1000–4999 pts| Q[Silver]
    O -->|5000+ pts| R[Gold]
    
    P --> S[Account page shows tier card + progress bar]
    Q --> S
    R --> S
```

---

## 7. Content & Editorial Flow (Articles + Drops)

```mermaid
flowchart TD
    A[Admin creates Article in CMS] --> B{Article type}
    B -->|Blog / Journal| C[Published to /journal/:slug]
    B -->|Drop article| D[Set countdown date + access code]
    
    D --> E{Drop date reached?}
    E -->|Before| F["/drops/:slug shows countdown timer"]
    E -->|After| G[Products associated with drop go live]
    
    D --> H{Access code set?}
    H -->|Yes| I[AccessGate component on drop page]
    I --> J[Customer enters code → sessionStorage unlock]
    J --> K[Full drop content + products revealed]
    H -->|No| L[Drop page publicly accessible]
    
    C --> M[/journal page lists all articles]
    M --> N[Homepage shows 3 recent articles]
    
    A --> O[Admin can: publish / archive / set hero image]
    O --> P[SiteConfig singleton — announcement bar text]
    P --> Q[Header announcement bar on all pages]
```

---

## 8. AI Features Flow

```mermaid
flowchart TD
    subgraph "PDP — Size Recommendation"
        A[Customer opens AI Size Finder] --> B[Enters height + weight + fit preference]
        B --> C[POST /api/v1/ai/size-rec]
        C --> D[Claude Haiku — prompt with sizes array]
        D --> E[Returns recommended size + reason]
        E --> F[Customer can tap 'Select X' to auto-select]
    end
    
    subgraph "Products Page — Visual Search"
        G[Customer taps camera icon] --> H[Uploads or takes photo]
        H --> I[Image → base64 → POST /api/v1/ai/visual-search]
        I --> J[Claude Vision — describe what clothing item this is]
        J --> K[Search query built from description]
        K --> L[Returns matching products]
    end
    
    subgraph "Admin — Description Generator"
        M[Admin fills product title + tags + fit] --> N[Clicks '✦ Generate with AI']
        N --> O[POST /api/v1/ai/description-gen]
        O --> P[Claude Haiku — brand-voice prompt]
        P --> Q[Generated description inserted into form]
    end
```

---

## 9. Vendor Task Flow

```mermaid
sequenceDiagram
    participant Admin as Admin Panel
    participant Backend as Backend API
    participant DB as MongoDB
    participant Vendor as Vendor Portal

    Admin->>Backend: POST /api/v1/vendor/tasks (assign order)
    Backend->>DB: Create VendorTask {status: pending}
    Backend-->>Admin: Task created ✓

    Vendor->>Backend: GET /api/v1/vendor/tasks (poll or page load)
    Backend-->>Vendor: List of pending tasks

    Vendor->>Backend: POST /api/v1/vendor/tasks/:id/advance
    Note over Backend: Status: pending → accepted → packed → shipped → delivered
    Backend->>DB: Update task status + add note
    Backend-->>Vendor: Updated task

    Admin->>Backend: GET /api/v1/admin/vendors/:id/performance
    Backend->>DB: Aggregate task stats
    Backend-->>Admin: Avg fulfillment time, completion rate
```

---

## 10. Authentication Flow

```mermaid
sequenceDiagram
    participant Browser as Web Browser
    participant Firebase as Firebase Auth
    participant Backend as Express Backend
    participant DB as MongoDB

    Browser->>Firebase: signInWithEmailAndPassword / Google OAuth
    Firebase-->>Browser: Firebase ID token (JWT)

    Browser->>Backend: POST /api/v1/auth/session { idToken }
    Backend->>Firebase: verifyIdToken(idToken)
    Firebase-->>Backend: Decoded Firebase user { uid, email }
    Backend->>DB: Upsert Customer { firebaseUid, email, name }
    Backend-->>Browser: Set httpOnly session cookie (JWT, 30 days)

    Browser->>Backend: Any authenticated request (cookie auto-sent)
    Backend->>Backend: Verify JWT session cookie
    Backend-->>Browser: Response with data

    Note over Browser,Backend: Admin panel uses different auth:
    Browser->>Backend: Any /admin/* request { Authorization: Bearer ADMIN_SECRET }
    Backend->>Backend: Compare token === process.env.ADMIN_SECRET
    Backend-->>Browser: Admin response
```

---

## 11. Payment Flow (Razorpay)

```mermaid
sequenceDiagram
    participant Web as Web App
    participant Backend as Express Backend
    participant Razorpay as Razorpay API
    participant DB as MongoDB

    Web->>Backend: POST /api/v1/orders (create order)
    Backend->>DB: Insert Order {status: pending_payment, total: computed server-side}
    Backend-->>Web: {order.id, order.total}

    Web->>Backend: POST /api/v1/payments/razorpay/order {orderId}
    Backend->>Razorpay: orders.create({amount: total*100, currency: INR})
    Razorpay-->>Backend: {id: rzp_order_xxx}
    Backend-->>Web: {providerOrderId, amount}

    Note over Web: Opens Razorpay checkout modal

    Web->>Razorpay: Customer completes payment
    Razorpay-->>Web: {razorpay_payment_id, razorpay_order_id, razorpay_signature}

    Web->>Backend: POST /api/v1/payments/razorpay/verify
    Backend->>Backend: HMAC-SHA256 verify signature
    Backend->>Razorpay: payments.capture(paymentId, amount)
    Backend->>DB: Order {status: paid, paymentStatus: captured}
    Backend->>DB: Decrement variant stock ($inc with $gte: 0 guard)
    Backend->>DB: Loyalty points earned
    Backend-->>Web: {success: true}

    Web->>Web: Clear cart → redirect /orders/:id/confirmation
```

---

## 12. Return & Refund Flow

```mermaid
flowchart TD
    A[Customer on delivered order page] --> B{Within 7 days of delivery?}
    B -->|No| C[Return option hidden]
    B -->|Yes| D[Customer opens return dialog]
    D --> E[Selects items + quantities + reasons]
    E --> F[POST /api/v1/orders/:id/return]
    F --> G[Return record created: status = requested]
    G --> H[Admin sees in Returns queue]
    H --> I{Admin decision}
    I -->|Approve| J[PATCH return — status = approved]
    J --> K[Razorpay refund API called]
    K --> L{Refund successful?}
    L -->|Yes| M[Order: paymentStatus = refunded]
    M --> N[Refund confirmation email to customer]
    I -->|Reject| O[PATCH return — status = rejected]
    O --> P[Rejection email to customer]
```
