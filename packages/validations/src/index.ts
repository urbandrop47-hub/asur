import { z } from "zod";
import { fulfillmentStatuses, orderStatuses, paymentStatuses, productStatuses, roles } from "@asur/constants";

export const roleSchema = z.enum(roles);
export const productStatusSchema = z.enum(productStatuses);
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
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().min(2),
  label: z.string().optional(),
  isDefault: z.boolean().optional()
});

export const phoneOtpSchema = z.object({
  phoneNumber: z.string().min(8)
});

export const authSessionSchema = z.object({
  idToken: z.string().min(10)
});

export const paymentCreateOrderSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().nonnegative()
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantSku: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative()
});

export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(cartItemSchema).min(1),
  shippingAddress: addressSchema
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
