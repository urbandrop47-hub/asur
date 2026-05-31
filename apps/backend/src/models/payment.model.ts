import { Schema, model, models } from "mongoose";
import type { Payment } from "@asur/types";

const paymentSchema = new Schema<Payment>(
  {
    id: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    providerOrderId: { type: String },
    providerPaymentId: { type: String },
    status: { type: String, required: true, default: "pending" },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const PaymentModel = models.Payment ?? model<Payment>("Payment", paymentSchema);
