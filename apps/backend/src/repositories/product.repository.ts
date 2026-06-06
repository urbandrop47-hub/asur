import type { FilterQuery } from "mongoose";
import type { Product } from "@asur/types";
import { hasMongoConnection } from "../config/env";
import { ProductModel } from "../models/product.model";
import { mockStore } from "./mock-store";

export type ProductSearchParams = {
  q?: string;
  category?: string;
  fit?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "popularity";
  collection?: string;
  page?: number;
  limit?: number;
};

export type ProductSearchResult = {
  products: Product[];
  total: number;
};

export type SuggestItem = {
  slug: string;
  title: string;
  category: string;
  image?: string;
};

export const productRepository = {
  async list(onlyActive = true) {
    if (hasMongoConnection) {
      const filter = onlyActive ? { status: "active" } : {};
      return ProductModel.find(filter).sort({ updatedAt: -1 }).lean<Product[]>().exec();
    }
    if (onlyActive) {
      return mockStore.products.filter((p) => p.status === "active");
    }
    return mockStore.products;
  },

  async search(params: ProductSearchParams): Promise<ProductSearchResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 24));
    const skip = (page - 1) * limit;

    if (hasMongoConnection) {
      const filter: FilterQuery<Product> = { status: "active" };

      if (params.q) {
        filter.$text = { $search: params.q };
      }
      if (params.category) {
        filter.category = params.category;
      }
      if (params.fit) {
        filter.fit = params.fit;
      }
      if (params.collection) {
        filter.collectionSlugs = params.collection;
      }

      // Variant-level filters — all conditions must match the same variant
      const variantMatch: Record<string, unknown> = {};
      if (params.size) variantMatch.size = params.size;
      if (params.color) variantMatch.color = { $regex: new RegExp(`^${params.color}$`, "i") };
      if (params.inStock) variantMatch.stock = { $gt: 0 };
      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        const priceFilter: Record<string, number> = {};
        if (params.minPrice !== undefined) priceFilter.$gte = params.minPrice;
        if (params.maxPrice !== undefined) priceFilter.$lte = params.maxPrice;
        variantMatch.price = priceFilter;
      }
      if (Object.keys(variantMatch).length > 0) {
        filter.variants = { $elemMatch: variantMatch };
      }

      // Price sorts need aggregation to compute min variant price
      if (params.sort === "price_asc" || params.sort === "price_desc") {
        const [agg] = await ProductModel.aggregate([
          { $match: filter },
          { $addFields: { _minPrice: { $min: "$variants.price" } } },
          {
            $facet: {
              total: [{ $count: "count" }],
              products: [
                { $sort: { _minPrice: params.sort === "price_asc" ? 1 : -1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: { _minPrice: 0 } }
              ]
            }
          }
        ]).exec();
        return {
          products: (agg?.products ?? []) as Product[],
          total: agg?.total?.[0]?.count ?? 0
        };
      }

      // Text-score sort when a query is present, otherwise newest
      const findQuery = params.q
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? ProductModel.find(filter).sort({ score: { $meta: "textScore" }, updatedAt: -1 } as any)
        : ProductModel.find(filter).sort({ updatedAt: -1 });

      const [products, total] = await Promise.all([
        findQuery.skip(skip).limit(limit).lean<Product[]>().exec(),
        ProductModel.countDocuments(filter)
      ]);
      return { products, total };
    }

    // Mock fallback — basic filtering in memory
    let result = mockStore.products.filter((p) => p.status === "active");
    if (params.q) {
      const q = params.q.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params.category) result = result.filter((p) => p.category === params.category);
    if (params.fit) result = result.filter((p) => p.fit === params.fit);
    if (params.collection) result = result.filter((p) => p.collectionSlugs?.includes(params.collection!));
    if (params.inStock) result = result.filter((p) => p.variants.some((v) => v.stock > 0));
    if (params.size) result = result.filter((p) => p.variants.some((v) => v.size === params.size));
    if (params.color) result = result.filter((p) => p.variants.some((v) => v.color.toLowerCase() === params.color!.toLowerCase()));
    if (params.minPrice !== undefined) result = result.filter((p) => p.variants.some((v) => v.price >= params.minPrice!));
    if (params.maxPrice !== undefined) result = result.filter((p) => p.variants.some((v) => v.price <= params.maxPrice!));
    if (params.sort === "price_asc") result.sort((a, b) => Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price)));
    if (params.sort === "price_desc") result.sort((a, b) => Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price)));
    const total = result.length;
    return { products: result.slice(skip, skip + limit), total };
  },

  async suggest(q: string, limit = 6): Promise<SuggestItem[]> {
    if (hasMongoConnection) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const docs = await ProductModel.find(
        { status: "active", $or: [{ title: regex }, { category: regex }, { tags: regex }] },
        { slug: 1, title: 1, category: 1, media: { $slice: 1 } }
      )
        .limit(limit)
        .lean()
        .exec();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (docs as unknown as Array<{ slug: string; title: string; category: string; media?: Array<{ url: string }> }>).map((d) => ({
        slug: d.slug,
        title: d.title,
        category: d.category,
        image: d.media?.[0]?.url
      }));
    }
    // Mock fallback
    const q2 = q.toLowerCase();
    return mockStore.products
      .filter((p) => p.status === "active" && (
        p.title.toLowerCase().includes(q2) ||
        p.category.toLowerCase().includes(q2) ||
        p.tags.some((t) => t.toLowerCase().includes(q2))
      ))
      .slice(0, limit)
      .map((p) => ({ slug: p.slug, title: p.title, category: p.category, image: p.media?.[0]?.url }));
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

  /** Atomically decrement a specific variant's stock by `quantity`.
   *  Returns `true` if the decrement succeeded, `false` if stock was insufficient
   *  (race-condition guard — prevents overselling under concurrent orders). */
  async decrementVariantStock(productId: string, sku: string, quantity: number): Promise<boolean> {
    if (hasMongoConnection) {
      const result = await ProductModel.updateOne(
        { id: productId, variants: { $elemMatch: { sku, stock: { $gte: quantity } } } },
        { $inc: { "variants.$.stock": -quantity } }
      );
      return result.modifiedCount > 0;
    }
    const product = mockStore.products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.sku === sku);
    if (!variant || variant.stock < quantity) return false;
    variant.stock -= quantity;
    return true;
  },

  /** Atomically increment a specific variant's stock (used on order cancellation / restock). */
  async incrementVariantStock(productId: string, sku: string, quantity: number): Promise<void> {
    if (hasMongoConnection) {
      await ProductModel.updateOne(
        { id: productId, "variants.sku": sku },
        { $inc: { "variants.$.stock": quantity } }
      );
      return;
    }
    const product = mockStore.products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.sku === sku);
    if (variant) variant.stock += quantity;
  },

  /** Set a specific variant's stock to an exact value (used by bulk restock / admin panel). */
  /** Set a variant's stock to an absolute value. Returns the previous stock level
   *  so the caller can detect 0→N transitions for back-in-stock alerts. */
  async setVariantStock(productId: string, sku: string, stock: number): Promise<number> {
    if (hasMongoConnection) {
      // findOneAndUpdate with { new: false } returns the pre-update doc, giving us
      // the previous stock atomically — no separate read needed (eliminates TOCTOU).
      const before = await ProductModel.findOneAndUpdate(
        { id: productId, "variants.sku": sku },
        { $set: { "variants.$.stock": stock } },
        { new: false }
      ).lean<{ variants: Array<{ sku: string; stock: number }> }>();
      const prevVariant = before?.variants.find((v) => v.sku === sku);
      return prevVariant?.stock ?? 0;
    }
    const product = mockStore.products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.sku === sku);
    const prev = variant?.stock ?? 0;
    if (variant) variant.stock = Math.max(0, stock);
    return prev;
  },

  /** List all products for inventory — all statuses, sorted by title. */
  async listAll(): Promise<Product[]> {
    if (hasMongoConnection) {
      return ProductModel.find({}).sort({ title: 1 }).lean<Product[]>().exec();
    }
    return [...mockStore.products].sort((a, b) => a.title.localeCompare(b.title));
  },

  async deleteById(id: string): Promise<boolean> {
    if (hasMongoConnection) {
      const result = await ProductModel.deleteOne({ id });
      return result.deletedCount > 0;
    }
    const idx = mockStore.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    mockStore.products.splice(idx, 1);
    return true;
  },

  async related(slug: string, limit = 4): Promise<Product[]> {
    if (hasMongoConnection) {
      const product = await ProductModel.findOne({ slug }).lean<Product>().exec();
      if (!product) return [];
      const docs = await ProductModel.aggregate([
        { $match: { status: "active", slug: { $ne: slug }, category: product.category } },
        { $sample: { size: limit } }
      ]).exec();
      return docs as Product[];
    }

    const product = mockStore.products.find((p) => p.slug === slug);
    if (!product) return [];
    const pool = mockStore.products.filter((p) => p.status === "active" && p.slug !== slug && p.category === product.category);
    // Fisher-Yates shuffle then slice
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, limit);
  }
};
