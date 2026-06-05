import { Schema, model, models } from "mongoose";

export type GiftCardDoc = {
  id: string;
  code: string;            // 16-char uppercase alphanumeric, e.g. "ABCD1234EFGH5678"
  initialAmount: number;   // INR, set at creation
  balance: number;         // remaining INR balance (partial redemption supported)
  purchasedBy?: string;    // customerId of buyer
  recipientEmail?: string; // who receives the delivery email
  recipientName?: string;
  message?: string;
  orderId?: string;        // order that purchased this gift card
  isActive: boolean;
  expiresAt: string;       // ISO date; "" = never
  createdAt: string;
  updatedAt: string;
};

const giftCardSchema = new Schema<GiftCardDoc>(
  {
    id: { type: String, required: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    initialAmount: { type: Number, required: true, min: 1 },
    balance: { type: Number, required: true, min: 0 },
    purchasedBy: { type: String },
    recipientEmail: { type: String },
    recipientName: { type: String },
    message: { type: String },
    orderId: { type: String },
    isActive: { type: Boolean, required: true, default: true },
    expiresAt: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

giftCardSchema.index({ purchasedBy: 1 });
giftCardSchema.index({ recipientEmail: 1 });

export const GiftCardModel = models.GiftCard ?? model<GiftCardDoc>("GiftCard", giftCardSchema);
