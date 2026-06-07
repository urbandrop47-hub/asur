export type ID = string;

export type Money = {
  amount: number;
  currency: "INR" | "USD";
  display: string;
};

export type SeoMeta = {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
};

export type MediaAsset = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

/** A short-form video attached to a product — stored separately from static images. */
export type ProductVideo = {
  /** R2 public URL for the video file (MP4 or WebM) */
  url: string;
  /** Optional poster-frame image URL shown before playback */
  poster?: string;
  /** Admin-supplied label e.g. "Front view", "Detail shot" */
  label?: string;
};

export type ProductStatus = "draft" | "active" | "archived" | "preorder";
export type ProductFit = "regular" | "oversized" | "boxy" | "relaxed";

export type ProductDrop = {
  slug: string;
  name: string;
  season?: string;
  launchDate?: string;
};

export type ProductVariant = {
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
  compareAtPrice?: number;
};

export type Product = {
  id: ID;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  media: MediaAsset[];
  variants: ProductVariant[];
  collectionSlugs: string[];
  drop?: ProductDrop;
  fit?: ProductFit;
  seo?: SeoMeta;
  status: ProductStatus;
  /** Estimated ship date for preorder products (ISO date string e.g. "2026-09-01") */
  preorderShipDate?: string;
  /** Short customer-facing note shown on PDP (e.g. "Ships September 2026") */
  preorderNote?: string;
  /** Short-form product videos — shown in the gallery alongside images */
  videos?: ProductVideo[];
  /** ISO timestamp set by Mongoose on first creation — used for New In / freshness signals */
  createdAt?: string;
};

export type Category = {
  id: ID;
  name: string;
  slug: string;
  description?: string;
};

export type CartItem = {
  productId: ID;
  variantSku: string;
  quantity: number;
  unitPrice: number;
};

export type Cart = {
  id: ID;
  userId?: ID;
  items: CartItem[];
  subtotal: number;
  currency: "INR";
  updatedAt: string;
};

export type Address = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label?: string;
  isDefault?: boolean;
};

export type UserRole = "CUSTOMER" | "ADMIN" | "VENDOR" | "SUPER_ADMIN";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";
export type AdminPermission =
  | "catalog:read"
  | "catalog:write"
  | "catalog:publish"
  | "catalog:inventory"
  | "content:write"
  | "orders:read"
  | "orders:refund"
  | "fulfillment:read"
  | "fulfillment:write"
  | "users:invite"
  | "users:assign-role"
  | "settings:write";

export type AdminInviteStatus = "pending" | "accepted" | "revoked" | "expired";

export type AdminAccessRule = {
  role: AdminRole;
  permissions: AdminPermission[];
};

export type AdminAccessModel = {
  roles: AdminRole[];
  permissions: AdminPermission[];
  invitePolicy: {
    mode: "invite-only";
    issuerRoles: AdminRole[];
  };
  rules: AdminAccessRule[];
};

export type AdminInvite = {
  id: ID;
  email: string;
  role: AdminRole;
  status: AdminInviteStatus;
  token: string;
  createdBy?: ID;
  acceptedBy?: ID;
  notes?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
};

export type EmailPrefs = {
  marketing: boolean;
};

export type UserProfile = {
  id: ID;
  firebaseUid: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  addresses: Address[];
  emailPrefs?: EmailPrefs;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  sessionId: ID;
  provider: "firebase";
  accessToken: string;
  expiresAt: string;
  user: UserProfile;
};

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

export type FulfillmentStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "ready_to_ship"
  | "shipped"
  | "delivered";

export type OrderItem = {
  productId: ID;
  title: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type Order = {
  id: ID;
  orderNumber: string;
  customerId?: ID;
  guestPhone?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: "INR";
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  vendorTaskId?: ID;
  trackingNumber?: string;
  courierName?: string;
  couponCode?: string;
  discountAmount?: number;
  loyaltyPointsRedeemed?: number;
  loyaltyPointsEarned?: number;
  loyaltyDiscount?: number;
  referralCode?: string;
  giftCardCode?: string;
  giftCardAmount?: number;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
};

export type CouponType = "percent" | "fixed" | "free_shipping";

export type Coupon = {
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  perCustomerLimit: number;
  isActive: boolean;
  expiresAt: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethod = "razorpay";

export type Payment = {
  id: ID;
  orderId: ID;
  provider: PaymentMethod;
  providerOrderId?: string;
  providerPaymentId?: string;
  status: PaymentStatus;
  amount: number;
  currency: "INR";
  createdAt: string;
  updatedAt: string;
};

export type Shipment = {
  id: ID;
  orderId: ID;
  trackingId?: string;
  courierName?: string;
  status: "pending" | "packed" | "shipped" | "delivered";
  shippedAt?: string;
  deliveredAt?: string;
};

export type VendorTask = {
  id: ID;
  orderId: ID;
  vendorId?: ID;
  status: "pending" | "in_progress" | "ready_to_ship" | "completed";
  notes?: string;
  trackingId?: string;
  courierName?: string;
  updatedAt: string;
};

export type Review = {
  id: ID;
  orderId: ID;
  customerId: ID;
  productId: ID;
  rating: number;
  body: string;
  approved: boolean;
  verifiedPurchase: boolean;
  helpfulVotes: number;
  unhelpfulVotes: number;
  helpfulVoters: string[];
  images: string[];
  createdAt: string;
};

export type WishlistEntry = {
  id: ID;
  userId: ID;
  productId: ID;
  createdAt: string;
};

export type ReturnStatus = "requested" | "approved" | "rejected" | "refunded";

export type ReturnItem = {
  variantSku: string;
  quantity: number;
  reason: string;
};

export type Return = {
  id: ID;
  orderId: ID;
  orderNumber: string;
  customerId: ID;
  items: ReturnItem[];
  reason: string;
  status: ReturnStatus;
  refundId?: string;
  refundAmount?: number;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type GiftCard = {
  id: ID;
  code: string;
  initialAmount: number;
  balance: number;
  purchasedBy?: ID;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  orderId?: ID;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: ApiMeta;
};
