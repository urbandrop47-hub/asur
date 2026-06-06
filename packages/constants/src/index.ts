export const APP_NAME = "ASUR";
export const APP_TAGLINE = "Premium streetwear commerce, built to scale.";
export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const roles = ["CUSTOMER", "ADMIN", "VENDOR", "SUPER_ADMIN"] as const;
export type Role = (typeof roles)[number];

export const adminRoles = ["ADMIN", "SUPER_ADMIN"] as const;
export const adminPermissions = [
  "catalog:read",
  "catalog:write",
  "catalog:publish",
  "catalog:inventory",
  "content:write",
  "orders:read",
  "orders:refund",
  "fulfillment:read",
  "fulfillment:write",
  "users:invite",
  "users:assign-role",
  "settings:write"
] as const;
export const adminInviteStatuses = ["pending", "accepted", "revoked", "expired"] as const;

export const adminRolePermissions = {
  ADMIN: [
    "catalog:read",
    "catalog:write",
    "catalog:publish",
    "catalog:inventory",
    "content:write",
    "orders:read",
    "fulfillment:read",
    "fulfillment:write"
  ],
  SUPER_ADMIN: [...adminPermissions]
} as const;

export const productStatuses = ["draft", "active", "archived", "preorder"] as const;
export const productFits = ["regular", "oversized", "boxy", "relaxed"] as const;
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

export const COURIER_TRACKING_URLS: Record<string, string> = {
  Delhivery: "https://www.delhivery.com/track/package/{tracking}",
  BlueDart: "https://www.bluedart.com/tracking?trackfor={tracking}",
  DTDC: "https://www.dtdc.in/tracking.asp?awb={tracking}",
  "India Post": "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx",
  Ekart: "https://ekartlogistics.com/shipmenttrack/{tracking}",
  Shadowfax: "https://www.shadowfax.in/track/{tracking}",
  Xpressbees: "https://www.xpressbees.com/track/{tracking}"
};

export function getCourierTrackingUrl(courierName: string, trackingNumber: string): string | null {
  const template = COURIER_TRACKING_URLS[courierName];
  if (!template) return null;
  if (template.includes("{tracking}")) {
    return template.replace("{tracking}", encodeURIComponent(trackingNumber));
  }
  // India Post: tracking number goes in query param
  return `${template}?consignment=${encodeURIComponent(trackingNumber)}`;
}

export const routePaths = {
  health: "/health",
  auth: `${API_BASE_PATH}/auth`,
  products: `${API_BASE_PATH}/products`,
  orders: `${API_BASE_PATH}/orders`,
  payments: `${API_BASE_PATH}/payments`,
  uploads: `${API_BASE_PATH}/uploads`,
  vendors: `${API_BASE_PATH}/vendors`
} as const;
