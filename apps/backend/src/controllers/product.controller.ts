import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { getProductBySlug, getRelatedProducts, searchProducts, suggestProducts } from "../services/product.service";
import { SearchEventModel } from "../models/search-event.model";
import { hasMongoConnection } from "../config/env";

const listQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  fit: z.enum(["regular", "oversized", "boxy", "relaxed"]).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  inStock: z.enum(["true", "1", "false", "0"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popularity"]).optional(),
  collection: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(24)
});

export const listProductsController: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Invalid query parameters", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const q = parsed.data;
  const result = await searchProducts({
    q: q.q,
    category: q.category,
    fit: q.fit,
    size: q.size,
    color: q.color,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    inStock: q.inStock === "true" || q.inStock === "1",
    sort: q.sort ?? "newest",
    collection: q.collection,
    page: q.page,
    limit: q.limit
  });

  // Log search event (fire-and-forget — never blocks the response)
  if (hasMongoConnection && q.q?.trim()) {
    SearchEventModel.create({
      query: q.q.trim().toLowerCase(),
      resultsCount: result.total,
      createdAt: new Date().toISOString()
    }).catch(() => {});
  }

  res.status(200).json({
    success: true,
    data: result.products,
    message: "Products fetched",
    meta: { page: q.page, pageSize: q.limit, total: result.total }
  });
});

export const getProductController: RequestHandler = asyncHandler(async (req, res) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const product = await getProductBySlug(slug);
  if (!product) {
    res.status(404).json({ success: false, message: "Product not found" });
    return;
  }
  sendSuccess(res, product, "Product fetched");
});

export const relatedProductsController: RequestHandler = asyncHandler(async (req, res) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const products = await getRelatedProducts(slug);
  sendSuccess(res, products, "Related products fetched");
});

// GET /api/v1/products/suggest?q=<query>
export const suggestController: RequestHandler = asyncHandler(async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q || q.length < 2) {
    sendSuccess(res, { products: [], categories: [] }, "No query");
    return;
  }
  const items = await suggestProducts(q, 6);
  const categories = [...new Set(items.map((i) => i.category))].slice(0, 3);
  sendSuccess(res, { products: items, categories }, "Suggestions fetched");
});
