export declare const APP_NAME = "ASUR";
export declare const APP_TAGLINE = "Premium streetwear commerce, built to scale.";
export declare const API_VERSION = "v1";
export declare const API_BASE_PATH = "/api/v1";
export declare const roles: readonly ["CUSTOMER", "ADMIN", "VENDOR", "SUPER_ADMIN"];
export type Role = (typeof roles)[number];
export declare const adminRoles: readonly ["ADMIN", "SUPER_ADMIN"];
export declare const adminPermissions: readonly ["catalog:read", "catalog:write", "catalog:publish", "catalog:inventory", "content:write", "orders:read", "orders:refund", "fulfillment:read", "fulfillment:write", "users:invite", "users:assign-role", "settings:write"];
export declare const adminInviteStatuses: readonly ["pending", "accepted", "revoked", "expired"];
export declare const adminRolePermissions: {
    readonly ADMIN: readonly ["catalog:read", "catalog:write", "catalog:publish", "catalog:inventory", "content:write", "orders:read", "fulfillment:read", "fulfillment:write"];
    readonly SUPER_ADMIN: readonly ["catalog:read", "catalog:write", "catalog:publish", "catalog:inventory", "content:write", "orders:read", "orders:refund", "fulfillment:read", "fulfillment:write", "users:invite", "users:assign-role", "settings:write"];
};
export declare const productStatuses: readonly ["draft", "active", "archived"];
export declare const productFits: readonly ["regular", "oversized", "boxy", "relaxed"];
export declare const orderStatuses: readonly ["draft", "pending_payment", "paid", "processing", "packed", "shipped", "delivered", "cancelled"];
export declare const fulfillmentStatuses: readonly ["unassigned", "assigned", "in_progress", "ready_to_ship", "shipped", "delivered"];
export declare const paymentStatuses: readonly ["pending", "authorized", "captured", "failed", "refunded"];
export declare const paymentProviders: readonly ["razorpay"];
export declare const storageProviders: readonly ["cloudflare-r2"];
export declare const collectionNames: {
    readonly users: "users";
    readonly products: "products";
    readonly categories: "categories";
    readonly carts: "carts";
    readonly orders: "orders";
    readonly payments: "payments";
    readonly shipments: "shipments";
    readonly vendorTasks: "vendorTasks";
    readonly reviews: "reviews";
    readonly wishlists: "wishlists";
};
export declare const routePaths: {
    readonly health: "/health";
    readonly auth: "/api/v1/auth";
    readonly products: "/api/v1/products";
    readonly orders: "/api/v1/orders";
    readonly payments: "/api/v1/payments";
    readonly uploads: "/api/v1/uploads";
    readonly vendors: "/api/v1/vendors";
};
//# sourceMappingURL=index.d.ts.map