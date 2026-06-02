import { Schema, model, models } from "mongoose";

export type CouponDoc = {
  code: string;            // e.g. "LAUNCH20" — unique, stored uppercased
  type: "percent" | "fixed" | "free_shipping";
  value: number;           // percent (0–100) or fixed INR amount
  minOrderValue: number;   // minimum subtotal to apply
  usageLimit: number;      // 0 = unlimited
  usedCount: number;       // atomically incremented on successful order
  perCustomerLimit: number; // 0 = unlimited per customer; 1 = single-use per account
  isActive: boolean;
  expiresAt: string;       // ISO date string; "" = no expiry
  description?: string;
  createdAt: string;
  updatedAt: string;
};

const couponSchema = new Schema<CouponDoc>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed", "free_shipping"], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, required: true, default: 0, min: 0 },
    usageLimit: { type: Number, required: true, default: 0, min: 0 },
    usedCount: { type: Number, required: true, default: 0, min: 0 },
    perCustomerLimit: { type: Number, required: true, default: 0, min: 0 },
    isActive: { type: Boolean, required: true, default: true },
    expiresAt: { type: String, default: "" },
    description: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

couponSchema.index({ code: 1 }, { unique: true });

export const CouponModel = models.Coupon ?? model<CouponDoc>("Coupon", couponSchema);
