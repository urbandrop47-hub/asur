import { Schema, model, models } from "mongoose";
import type { Order } from "@asur/types";

const addressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    label: { type: String },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    title: { type: String, required: true },
    variantSku: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new Schema<Order & { providerOrderId?: string; loyaltyPointsRedeemed?: number; loyaltyPointsEarned?: number; loyaltyDiscount?: number; referralCode?: string; giftCardCode?: string; giftCardAmount?: number; reviewEmailSentAt?: string; deliveredAt?: string; guestPhone?: string }>(
  {
    id: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: false, index: true, sparse: true },
    guestPhone: { type: String, index: true, sparse: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyDiscount: { type: Number, default: 0 },
    referralCode: { type: String },
    giftCardCode: { type: String },
    giftCardAmount: { type: Number, default: 0 },
    currency: { type: String, required: true, default: "INR" },
    status: { type: String, required: true, default: "pending_payment", index: true },
    paymentStatus: { type: String, required: true, default: "pending" },
    fulfillmentStatus: { type: String, required: true, default: "unassigned" },
    vendorTaskId: { type: String },
    trackingNumber: { type: String },
    courierName: { type: String },
    reviewEmailSentAt: { type: String }, // set by review-request cron; guards against re-sending
    deliveredAt: { type: String },       // set when status transitions to "delivered"
    providerOrderId: { type: String },
    shippingAddress: { type: addressSchema, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const OrderModel = models.Order ?? model<Order & { providerOrderId?: string; loyaltyPointsRedeemed?: number; loyaltyPointsEarned?: number; loyaltyDiscount?: number; referralCode?: string; giftCardCode?: string; giftCardAmount?: number; reviewEmailSentAt?: string; guestPhone?: string }>("Order", orderSchema);
