import { Schema, model, models } from "mongoose";

export type StockAlertDoc = {
  productId: string;
  variantSku: string;
  email: string;
  createdAt: string;
  notifiedAt?: string;
};

const stockAlertSchema = new Schema<StockAlertDoc>(
  {
    productId: { type: String, required: true, index: true },
    variantSku: { type: String, required: true, index: true },
    email: { type: String, required: true },
    createdAt: { type: String, required: true },
    notifiedAt: { type: String }
  },
  { versionKey: false }
);

// One signup per email per variant
stockAlertSchema.index({ productId: 1, variantSku: 1, email: 1 }, { unique: true });

export const StockAlertModel = models.StockAlert ?? model<StockAlertDoc>("StockAlert", stockAlertSchema);
