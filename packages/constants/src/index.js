"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routePaths = exports.collectionNames = exports.storageProviders = exports.paymentProviders = exports.paymentStatuses = exports.fulfillmentStatuses = exports.orderStatuses = exports.productStatuses = exports.roles = exports.API_BASE_PATH = exports.API_VERSION = exports.APP_TAGLINE = exports.APP_NAME = void 0;
exports.APP_NAME = "ASUR";
exports.APP_TAGLINE = "Premium streetwear commerce, built to scale.";
exports.API_VERSION = "v1";
exports.API_BASE_PATH = `/api/${exports.API_VERSION}`;
exports.roles = ["CUSTOMER", "ADMIN", "VENDOR", "SUPER_ADMIN"];
exports.productStatuses = ["draft", "active", "archived"];
exports.orderStatuses = [
    "draft",
    "pending_payment",
    "paid",
    "processing",
    "packed",
    "shipped",
    "delivered",
    "cancelled"
];
exports.fulfillmentStatuses = [
    "unassigned",
    "assigned",
    "in_progress",
    "ready_to_ship",
    "shipped",
    "delivered"
];
exports.paymentStatuses = ["pending", "authorized", "captured", "failed", "refunded"];
exports.paymentProviders = ["razorpay"];
exports.storageProviders = ["cloudflare-r2"];
exports.collectionNames = {
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
exports.routePaths = {
    health: "/health",
    auth: `${exports.API_BASE_PATH}/auth`,
    products: `${exports.API_BASE_PATH}/products`,
    orders: `${exports.API_BASE_PATH}/orders`,
    payments: `${exports.API_BASE_PATH}/payments`,
    uploads: `${exports.API_BASE_PATH}/uploads`,
    vendors: `${exports.API_BASE_PATH}/vendors`
};
