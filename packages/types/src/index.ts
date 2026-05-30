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

export type ProductStatus = "draft" | "active" | "archived";

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
  seo?: SeoMeta;
  status: ProductStatus;
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

export type UserProfile = {
  id: ID;
  firebaseUid: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  addresses: Address[];
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
  customerId: ID;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: "INR";
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  vendorTaskId?: ID;
  shippingAddress: Address;
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
  updatedAt: string;
};

export type Review = {
  id: ID;
  productId: ID;
  userId: ID;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
};

export type WishlistEntry = {
  id: ID;
  userId: ID;
  productId: ID;
  createdAt: string;
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
