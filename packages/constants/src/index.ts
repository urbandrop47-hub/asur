export const APP_NAME = "ASUR";
export const APP_TAGLINE = "Premium streetwear commerce, built to scale.";
export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const roles = ["CUSTOMER", "ADMIN", "VENDOR", "SUPER_ADMIN"] as const;
export type Role = (typeof roles)[number];

export const productStatuses = ["draft", "active", "archived"] as const;
export const orderStatuses = [
  "draft",
  "pending_payment",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled"
] as const;

export const fulfillmentStatuses = [
  "unassigned",
  "assigned",
  "in_progress",
  "ready_to_ship",
  "shipped",
  "delivered"
] as const;

export const paymentStatuses = ["pending", "authorized", "captured", "failed", "refunded"] as const;

export const paymentProviders = ["razorpay"] as const;
export const storageProviders = ["cloudflare-r2"] as const;

export const collectionNames = {
  users: "users",
  products: "products",
  categories: "categories",
  carts: "carts",
  orders: "orders",
  payments: "payments",
  shipments: "shipments",
  vendorTasks: "vendorTasks",
  reviews: "reviews",
  wishlists: "wishlists"
} as const;

export const routePaths = {
  health: "/health",
  auth: `${API_BASE_PATH}/auth`,
  products: `${API_BASE_PATH}/products`,
  orders: `${API_BASE_PATH}/orders`,
  payments: `${API_BASE_PATH}/payments`,
  uploads: `${API_BASE_PATH}/uploads`,
  vendors: `${API_BASE_PATH}/vendors`
} as const;
