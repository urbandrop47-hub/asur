import { productFits } from "@asur/constants";
import { z } from "zod";

export const roles = ["CUSTOMER", "ADMIN", "VENDOR", "SUPER_ADMIN"] as const;
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
export const productStatuses = ["draft", "active", "archived"] as const;
export const productDropSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  season: z.string().optional(),
  launchDate: z.string().datetime().optional()
});
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
export const fulfillmentStatuses = ["unassigned", "assigned", "in_progress", "ready_to_ship", "shipped", "delivered"] as const;
export const paymentStatuses = ["pending", "authorized", "captured", "failed", "refunded"] as const;

export const roleSchema = z.enum(roles);
export const adminRoleSchema = z.enum(adminRoles);
export const adminPermissionSchema = z.enum(adminPermissions);
export const adminInviteStatusSchema = z.enum(adminInviteStatuses);
export const productStatusSchema = z.enum(productStatuses);
export const productFitSchema = z.enum(productFits);
export const orderStatusSchema = z.enum(orderStatuses);
export const fulfillmentStatusSchema = z.enum(fulfillmentStatuses);
export const paymentStatusSchema = z.enum(paymentStatuses);

export const mediaAssetSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
});

export const productVariantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  sku: z.string().min(1),
  stock: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional()
});

export const productSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  category: z.string().min(2),
  tags: z.array(z.string()).default([]),
  media: z.array(mediaAssetSchema).default([]),
  variants: z.array(productVariantSchema).min(1),
  collectionSlugs: z.array(z.string().min(1)).default([]),
  drop: productDropSchema.optional(),
  fit: productFitSchema.optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      canonical: z.string().url().optional()
    })
    .optional(),
  status: productStatusSchema
});

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().regex(/^\+?[\d\s\-]{10,15}$/, "Enter a valid phone number (10–15 digits)"),
  line1: z.string().min(2, "Address line 1 is required"),
  line2: z.string().min(1).optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(4, "Valid pincode required").max(10),
  country: z.string().min(2),
  label: z.string().min(1).optional(),
  isDefault: z.boolean().optional()
});

export const phoneOtpSchema = z.object({
  phoneNumber: z.string().min(8)
});

export const authSessionSchema = z.object({
  idToken: z.string().min(10)
});

export const adminInviteSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: adminRoleSchema,
  status: adminInviteStatusSchema,
  token: z.string().min(16),
  createdBy: z.string().min(1).optional(),
  acceptedBy: z.string().min(1).optional(),
  notes: z.string().optional(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  acceptedAt: z.string().datetime().optional()
});

export const adminAccessRuleSchema = z.object({
  role: adminRoleSchema,
  permissions: z.array(adminPermissionSchema).min(1)
});

export const adminAccessModelSchema = z.object({
  roles: z.array(adminRoleSchema).min(1),
  permissions: z.array(adminPermissionSchema).min(1),
  invitePolicy: z.object({
    mode: z.literal("invite-only"),
    issuerRoles: z.array(adminRoleSchema).min(1)
  }),
  rules: z.array(adminAccessRuleSchema).min(1)
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantSku: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  // Server-side only: set from the product catalogue, never trusted from client.
  productTitle: z.string().optional()
});

// Server-side schema — includes customerId (injected from session, never trusted from request body).
export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(cartItemSchema).min(1),
  shippingAddress: addressSchema,
  couponCode: z.string().trim().toUpperCase().optional(),
  loyaltyPointsToRedeem: z.number().int().nonnegative().optional().default(0),
  referralCode: z.string().trim().toUpperCase().optional()
});

// amount is intentionally omitted — the server derives it from order.total
// to prevent clients from submitting a tampered (e.g. 1 paise) amount.
export const paymentCreateOrderSchema = z.object({
  orderId: z.string().min(1)
});

export const paymentVerificationSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1)
});

export type ProductInput = z.infer<typeof productSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreatePaymentOrderInput = z.infer<typeof paymentCreateOrderSchema>;
