import { Schema, model, models } from "mongoose";

type WishlistItem = {
  customerId: string;
  productId: string;
  addedAt: string;
};

const wishlistSchema = new Schema<WishlistItem>(
  {
    customerId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    addedAt: { type: String, required: true }
  },
  { versionKey: false }
);

wishlistSchema.index({ customerId: 1, productId: 1 }, { unique: true });

export const WishlistModel = models.Wishlist ?? model<WishlistItem>("Wishlist", wishlistSchema);
