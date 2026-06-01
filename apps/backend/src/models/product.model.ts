import { Schema, model, models } from "mongoose";
import { productFits } from "@asur/constants";
import type { Product } from "@asur/types";

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String },
    width: { type: Number },
    height: { type: Number }
  },
  { _id: false }
);

const variantSchema = new Schema(
  {
    size: { type: String, required: true },
    color: { type: String, required: true },
    sku: { type: String, required: true },
    stock: { type: Number, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number }
  },
  { _id: false }
);

const productSchema = new Schema<Product>(
  {
    id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    media: { type: [mediaSchema], default: [] },
    variants: { type: [variantSchema], default: [] },
    collectionSlugs: { type: [String], default: [] },
    drop: {
      slug: { type: String },
      name: { type: String },
      season: { type: String },
      launchDate: { type: String }
    },
    fit: { type: String, enum: productFits },
    seo: { type: Schema.Types.Mixed },
    status: { type: String, required: true, default: "active" }
  },
  { versionKey: false }
);

// Full-text search index for S10 search feature
productSchema.index({ title: "text", description: "text", tags: "text" }, { weights: { title: 10, tags: 5, description: 1 } });

export const ProductModel = models.Product ?? model<Product>("Product", productSchema);
