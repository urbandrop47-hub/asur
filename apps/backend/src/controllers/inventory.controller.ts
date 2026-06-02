import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { AppError } from "../lib/errors";
import { productRepository } from "../repositories/product.repository";
import {
  bulkUpdateStock,
  registerStockAlert,
  triggerBackInStockNotifications
} from "../services/inventory.service";
import { cancelOrder } from "../services/order.service";

// ── Admin: GET /api/v1/admin/inventory ──────────────────────────────────────
// Returns every product with all variants (all statuses, including draft)
export const listInventoryController: RequestHandler = asyncHandler(async (_req, res) => {
  const products = await productRepository.listAll();
  sendSuccess(res, { products }, "Inventory fetched");
});

// ── Admin: PATCH /api/v1/admin/inventory/stock ───────────────────────────────
// Inline single-variant stock update from the admin panel
export const updateStockController: RequestHandler = asyncHandler(async (req, res) => {
  const { productId, sku, stock } = z.object({
    productId: z.string().min(1),
    sku: z.string().min(1),
    stock: z.number().int().min(0)
  }).parse(req.body);

  const product = await productRepository.findById(productId);
  if (!product) throw new AppError(404, "Product not found");

  const variant = product.variants.find((v) => v.sku === sku);
  if (!variant) throw new AppError(404, "Variant SKU not found");

  await productRepository.setVariantStock(productId, sku, stock);

  // If restocked, notify back-in-stock subscribers
  if (stock > 0 && variant.stock === 0) {
    void triggerBackInStockNotifications(productId, sku);
  }

  sendSuccess(res, { productId, sku, stock }, "Stock updated");
});

// ── Admin: POST /api/v1/admin/inventory/bulk-stock ───────────────────────────
// Accepts JSON array of { sku, stock } or raw CSV text in body.stock_csv
export const bulkStockUpdateController: RequestHandler = asyncHandler(async (req, res) => {
  let rows: Array<{ sku: string; stock: number }>;

  // Accept either JSON array or CSV text
  if (typeof req.body.csv === "string") {
    // Parse CSV: header row "sku,stock" then data rows
    const lines = req.body.csv.trim().split(/\r?\n/).filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().startsWith("sku") ? lines.slice(1) : lines;
    rows = dataLines.map((line: string) => {
      const [sku, stockStr] = line.split(",").map((s: string) => s.trim());
      const stock = parseInt(stockStr ?? "0", 10);
      if (!sku || isNaN(stock) || stock < 0) throw new AppError(400, `Invalid CSV row: "${line}"`);
      return { sku, stock };
    });
  } else {
    rows = z.array(z.object({ sku: z.string().min(1), stock: z.number().int().min(0) })).parse(req.body.rows);
  }

  if (rows.length === 0) throw new AppError(400, "No rows provided");

  const result = await bulkUpdateStock(rows);
  sendSuccess(res, result, `Updated ${result.updated} variant(s)`);
});

// ── Admin: POST /api/v1/admin/orders/:id/cancel ──────────────────────────────
export const cancelOrderController: RequestHandler = asyncHandler(async (req, res) => {
  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const order = await cancelOrder(orderId, res.locals.user.id, true);
  sendSuccess(res, { order }, "Order cancelled and stock released");
});

// ── Public: POST /api/v1/stock-alerts ────────────────────────────────────────
export const registerStockAlertController: RequestHandler = asyncHandler(async (req, res) => {
  const { productId, variantSku, email } = z.object({
    productId: z.string().min(1),
    variantSku: z.string().min(1),
    email: z.string().email()
  }).parse(req.body);

  const product = await productRepository.findById(productId);
  if (!product || product.status !== "active") throw new AppError(404, "Product not found");

  const variant = product.variants.find((v) => v.sku === variantSku);
  if (!variant) throw new AppError(404, "Variant not found");
  if (variant.stock > 0) throw new AppError(422, "This variant is currently in stock");

  await registerStockAlert(productId, variantSku, email);
  sendSuccess(res, null, "You'll be notified when this item is back in stock", 201);
});
