import { Schema, model, models } from "mongoose";
import type { Return } from "../shared/types";

const returnItemSchema = new Schema(
  {
    variantSku: { type: String, required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true }
  },
  { _id: false }
);

const returnSchema = new Schema<Return>(
  {
    id: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    customerId: { type: String, required: true, index: true },
    items: { type: [returnItemSchema], required: true },
    reason: { type: String, required: true },
    status: { type: String, required: true, default: "requested", index: true },
    refundId: { type: String },
    refundAmount: { type: Number },
    adminNote: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const ReturnModel = models.Return ?? model<Return>("Return", returnSchema);
