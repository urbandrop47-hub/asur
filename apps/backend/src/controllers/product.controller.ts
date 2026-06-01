import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { getProductBySlug, searchProducts } from "../services/product.service";

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
  collection: z.string().optional()
});

export const listProductsController: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Invalid query parameters", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const q = parsed.data;
  const products = await searchProducts({
    q: q.q,
    category: q.category,
    fit: q.fit,
    size: q.size,
    color: q.color,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    inStock: q.inStock === "true" || q.inStock === "1",
    sort: q.sort ?? "newest",
    collection: q.collection
  });
  sendSuccess(res, products, "Products fetched");
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
