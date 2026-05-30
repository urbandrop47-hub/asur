export const APP_NAME = "ASUR";
export const APP_TAGLINE = "Premium streetwear commerce, built to scale.";
export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;
export const roles = ["CUSTOMER", "ADMIN", "VENDOR", "SUPER_ADMIN"];
export const adminRoles = ["ADMIN", "SUPER_ADMIN"];
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
];
export const adminInviteStatuses = ["pending", "accepted", "revoked", "expired"];
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
};
export const productStatuses = ["draft", "active", "archived"];
export const productFits = ["regular", "oversized", "boxy", "relaxed"];
export const orderStatuses = [
    "draft",
    "pending_payment",
    "paid",
    "processing",
    "packed",
    "shipped",
    "delivered",
    "cancelled"
];
export const fulfillmentStatuses = [
    "unassigned",
    "assigned",
    "in_progress",
    "ready_to_ship",
    "shipped",
    "delivered"
];
export const paymentStatuses = ["pending", "authorized", "captured", "failed", "refunded"];
export const paymentProviders = ["razorpay"];
export const storageProviders = ["cloudflare-r2"];
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
};
export const routePaths = {
    health: "/health",
    auth: `${API_BASE_PATH}/auth`,
    products: `${API_BASE_PATH}/products`,
    orders: `${API_BASE_PATH}/orders`,
    payments: `${API_BASE_PATH}/payments`,
    uploads: `${API_BASE_PATH}/uploads`,
    vendors: `${API_BASE_PATH}/vendors`
};
