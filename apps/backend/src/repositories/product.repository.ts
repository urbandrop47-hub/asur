import type { Product } from "@asur/types";
import { hasMongoConnection } from "../config/env";
import { ProductModel } from "../models/product.model";
import { mockStore } from "./mock-store";

export const productRepository = {
  async list() {
    if (hasMongoConnection) {
      return ProductModel.find().sort({ updatedAt: -1 }).lean<Product[]>().exec();
    }

    return mockStore.products;
  },

  async findBySlug(slug: string) {
    if (hasMongoConnection) {
      return ProductModel.findOne({ slug }).lean<Product>().exec();
    }

    return mockStore.products.find((product) => product.slug === slug) ?? null;
  }
};
