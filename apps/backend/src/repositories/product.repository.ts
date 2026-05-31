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
    return mockStore.products.find((p) => p.slug === slug) ?? null;
  },

  async findById(id: string) {
    if (hasMongoConnection) {
      return ProductModel.findOne({ id }).lean<Product>().exec();
    }
    return mockStore.products.find((p) => p.id === id) ?? null;
  },

  async create(product: Product) {
    if (hasMongoConnection) {
      const doc = await ProductModel.create(product);
      return doc.toObject() as Product;
    }
    mockStore.products.push(product);
    return product;
  },

  async update(id: string, updates: Partial<Omit<Product, "id">>) {
    if (hasMongoConnection) {
      return ProductModel.findOneAndUpdate({ id }, updates, { new: true }).lean<Product>().exec();
    }
    const product = mockStore.products.find((p) => p.id === id);
    if (!product) return null;
    Object.assign(product, updates);
    return product;
  },

  async deleteById(id: string) {
    if (hasMongoConnection) {
      await ProductModel.deleteOne({ id });
      return;
    }
    const idx = mockStore.products.findIndex((p) => p.id === id);
    if (idx !== -1) mockStore.products.splice(idx, 1);
  }
};
