import { Schema, model, models } from "mongoose";
import type { VendorTask } from "@asur/types";

const vendorTaskSchema = new Schema<VendorTask>(
  {
    id: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    vendorId: { type: String },
    status: { type: String, required: true, default: "pending" },
    notes: { type: String },
    trackingId: { type: String },
    courierName: { type: String },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const VendorTaskModel = models.VendorTask ?? model<VendorTask>("VendorTask", vendorTaskSchema);
