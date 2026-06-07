import type { RequestHandler, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { getProductBySlug, getRelatedProducts, searchProducts, suggestProducts } from "../services/product.service";
import { productRepository } from "../repositories/product.repository";
import { SearchEventModel } from "../models/search-event.model";
import { ProductModel } from "../models/product.model";
import { ArticleModel } from "../models/article.model";
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

// ── GET /api/v1/products/:slug/stock-stream (SSE) ──────────────────────────────
// Streams variant stock levels every 20s; only emits when values change.
// No auth — this is public read-only data, same as the product endpoint.
export function stockStreamController(req: Request, res: Response): void {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Track last emitted stock snapshot to skip no-op ticks
  let lastSnapshot = "";

  async function emit() {
    if (!hasMongoConnection || res.writableEnded) return;
    try {
      const product = await ProductModel.findOne({ slug }).select("variants").lean<{ variants: Array<{ sku: string; stock: number }> }>();
      if (!product || res.writableEnded) return; // re-check after await
      const snapshot = JSON.stringify(
        product.variants.map((v) => ({ sku: v.sku, stock: v.stock }))
      );
      if (snapshot === lastSnapshot) return; // no change — skip
      lastSnapshot = snapshot;
      res.write(`data: ${snapshot}\n\n`);
    } catch {
      // DB hiccup — skip this tick, try again next interval
    }
  }

  // Emit immediately, then every 20s
  void emit();
  const poll = setInterval(() => { void emit(); }, 20000);

  // Heartbeat every 25s to prevent proxy timeouts
  const heartbeat = setInterval(() => { res.write(":heartbeat\n\n"); }, 25000);

  req.on("close", () => {
    clearInterval(poll);
    clearInterval(heartbeat);
  });
}

// ── POST /api/v1/drops/:slug/access ───────────────────────────────────────────
// Verifies a drop access code. Returns { valid: true } or 403.
// Does NOT reveal the code in the article response — strips it server-side.
export const verifyDropAccessController: RequestHandler = asyncHandler(async (req, res) => {
  const dropSlug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const code = typeof req.body.code === "string" ? req.body.code.trim().toUpperCase() : "";

  if (!code) {
    res.status(400).json({ success: false, message: "Access code required" });
    return;
  }

  const article = await ArticleModel.findOne({ slug: dropSlug, type: "drop" }).select("accessCode").lean<{ accessCode?: string }>();
  if (!article) {
    res.status(404).json({ success: false, message: "Drop not found" });
    return;
  }

  // No access code set → drop is open
  if (!article.accessCode) {
    res.status(200).json({ success: true, message: "Drop is open" });
    return;
  }

  const valid = article.accessCode.toUpperCase() === code;
  if (!valid) {
    res.status(403).json({ success: false, message: "Invalid access code" });
    return;
  }

  res.status(200).json({ success: true, message: "Access granted" });
});

// ── GET /api/v1/products/new-in ───────────────────────────────────────────────
export const newInController: RequestHandler = asyncHandler(async (req, res) => {
  const days  = Math.min(90, Math.max(1, Number(req.query.days)  || 30));
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 24));
  const products = await productRepository.newIn(days, limit);
  sendSuccess(res, products, "New-in products fetched");
});

// ── GET /api/v1/products/bestsellers ─────────────────────────────────────────
export const bestsellersController: RequestHandler = asyncHandler(async (req, res) => {
  const days  = Math.min(365, Math.max(1, Number(req.query.days)  || 30));
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 24));
  const products = await productRepository.bestsellers(days, limit);
  sendSuccess(res, products, "Bestsellers fetched");
});
