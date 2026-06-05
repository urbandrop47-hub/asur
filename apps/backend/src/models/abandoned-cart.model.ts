import { Schema, model, models } from "mongoose";

export type AbandonedCartItem = {
  productId: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  productTitle: string;
  productSlug: string;
  imageUrl?: string;
  size: string;
  color: string;
};

export type AbandonedCartDoc = {
  email: string;
  customerId?: string;
  customerName?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  recoveryToken: string;
  lastActivityAt: Date;
  email1SentAt?: Date;
  email2SentAt?: Date;
  couponCode?: string;
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const itemSchema = new Schema<AbandonedCartItem>(
  {
    productId: { type: String, required: true },
    variantSku: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    productTitle: { type: String, required: true },
    productSlug: { type: String, required: true },
    imageUrl: { type: String },
    size: { type: String, required: true },
    color: { type: String, required: true },
  },
  { _id: false }
);

const abandonedCartSchema = new Schema<AbandonedCartDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    customerId: { type: String, index: true },
    customerName: { type: String },
    items: { type: [itemSchema], required: true },
    subtotal: { type: Number, required: true },
    recoveryToken: { type: String, required: true, unique: true, index: true },
    lastActivityAt: { type: Date, required: true, index: true },
    email1SentAt: { type: Date },
    email2SentAt: { type: Date },
    couponCode: { type: String },
    convertedAt: { type: Date, index: true },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const AbandonedCartModel =
  models.AbandonedCart ?? model<AbandonedCartDoc>("AbandonedCart", abandonedCartSchema);
