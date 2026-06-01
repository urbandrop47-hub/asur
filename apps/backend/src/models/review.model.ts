import { Schema, model, models } from "mongoose";
import type { Review } from "../shared/types";

const reviewSchema = new Schema<Review>(
  {
    id: { type: String, required: true, index: true },
    orderId: { type: String, required: true },
    customerId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    body: { type: String, required: true },
    approved: { type: Boolean, required: true, default: false },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
);

// One review per customer per product
reviewSchema.index({ customerId: 1, productId: 1 }, { unique: true });

export const ReviewModel = models.Review ?? model<Review>("Review", reviewSchema);
