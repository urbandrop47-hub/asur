"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentVerificationSchema = exports.createOrderSchema = exports.cartItemSchema = exports.paymentCreateOrderSchema = exports.authSessionSchema = exports.phoneOtpSchema = exports.addressSchema = exports.productSchema = exports.productVariantSchema = exports.mediaAssetSchema = exports.paymentStatusSchema = exports.fulfillmentStatusSchema = exports.orderStatusSchema = exports.productStatusSchema = exports.roleSchema = exports.paymentStatuses = exports.fulfillmentStatuses = exports.orderStatuses = exports.productStatuses = exports.roles = void 0;
const zod_1 = require("zod");
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
exports.fulfillmentStatuses = ["unassigned", "assigned", "in_progress", "ready_to_ship", "shipped", "delivered"];
exports.paymentStatuses = ["pending", "authorized", "captured", "failed", "refunded"];
exports.roleSchema = zod_1.z.enum(exports.roles);
exports.productStatusSchema = zod_1.z.enum(exports.productStatuses);
exports.orderStatusSchema = zod_1.z.enum(exports.orderStatuses);
exports.fulfillmentStatusSchema = zod_1.z.enum(exports.fulfillmentStatuses);
exports.paymentStatusSchema = zod_1.z.enum(exports.paymentStatuses);
exports.mediaAssetSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    alt: zod_1.z.string().optional(),
    width: zod_1.z.number().int().positive().optional(),
    height: zod_1.z.number().int().positive().optional()
});
exports.productVariantSchema = zod_1.z.object({
    size: zod_1.z.string().min(1),
    color: zod_1.z.string().min(1),
    sku: zod_1.z.string().min(1),
    stock: zod_1.z.number().int().nonnegative(),
    price: zod_1.z.number().nonnegative(),
    compareAtPrice: zod_1.z.number().nonnegative().optional()
});
exports.productSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
    description: zod_1.z.string().min(10),
    category: zod_1.z.string().min(2),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    media: zod_1.z.array(exports.mediaAssetSchema).default([]),
    variants: zod_1.z.array(exports.productVariantSchema).min(1),
    seo: zod_1.z
        .object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        keywords: zod_1.z.array(zod_1.z.string()).optional(),
        canonical: zod_1.z.string().url().optional()
    })
        .optional(),
    status: exports.productStatusSchema
});
exports.addressSchema = zod_1.z.object({
    line1: zod_1.z.string().min(2),
    line2: zod_1.z.string().optional(),
    city: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    postalCode: zod_1.z.string().min(3),
    country: zod_1.z.string().min(2),
    label: zod_1.z.string().optional(),
    isDefault: zod_1.z.boolean().optional()
});
exports.phoneOtpSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().min(8)
});
exports.authSessionSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(10)
});
exports.paymentCreateOrderSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    amount: zod_1.z.number().nonnegative()
});
exports.cartItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    variantSku: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().nonnegative()
});
exports.createOrderSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1),
    items: zod_1.z.array(exports.cartItemSchema).min(1),
    shippingAddress: exports.addressSchema
});
exports.paymentVerificationSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    razorpayOrderId: zod_1.z.string().min(1),
    razorpayPaymentId: zod_1.z.string().min(1),
    razorpaySignature: zod_1.z.string().min(1)
});
