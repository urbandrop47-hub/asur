import { hasMongoConnection } from "../config/env";
import { StockAlertModel } from "../models/stock-alert.model";
import { productRepository } from "../repositories/product.repository";
import { sendBackInStockEmail } from "./email.service";

// ─── In-memory fallback ──────────────────────────────────────────────────────
const mockAlerts: Array<{ productId: string; variantSku: string; email: string; createdAt: string; notifiedAt?: string }> = [];

// ─── Back-in-stock alert signup ──────────────────────────────────────────────

export async function registerStockAlert(productId: string, variantSku: string, email: string): Promise<void> {
  const now = new Date().toISOString();
  if (hasMongoConnection) {
    await StockAlertModel.findOneAndUpdate(
      { productId, variantSku, email },
      { $setOnInsert: { productId, variantSku, email, createdAt: now } },
      { upsert: true }
    );
    return;
  }
  const exists = mockAlerts.some((a) => a.productId === productId && a.variantSku === variantSku && a.email === email);
  if (!exists) mockAlerts.push({ productId, variantSku, email, createdAt: now });
}

/** Fire back-in-stock notifications for every alert subscriber of a given variant.
 *  Called after stock is incremented (order cancel, admin restock, bulk upload). */
export async function triggerBackInStockNotifications(productId: string, variantSku: string): Promise<void> {
  const product = await productRepository.findById(productId);
  if (!product) return;

  const variant = product.variants.find((v) => v.sku === variantSku);
  if (!variant || variant.stock <= 0) return; // still OOS — don't notify yet

  if (hasMongoConnection) {
    // Find all un-notified subscribers for this variant
    const alerts = await StockAlertModel.find({ productId, variantSku, notifiedAt: { $exists: false } }).lean().exec();
    if (alerts.length === 0) return;

    const now = new Date().toISOString();
    await Promise.all(
      alerts.map(async (alert) => {
        await sendBackInStockEmail(product.title, product.slug, variantSku, variant.size, variant.color, alert.email);
        await StockAlertModel.updateOne({ _id: alert._id }, { $set: { notifiedAt: now } });
      })
    );
    return;
  }

  // Mock fallback
  const pending = mockAlerts.filter((a) => a.productId === productId && a.variantSku === variantSku && !a.notifiedAt);
  const now = new Date().toISOString();
  for (const alert of pending) {
    await sendBackInStockEmail(product.title, product.slug, variantSku, variant.size, variant.color, alert.email);
    alert.notifiedAt = now;
  }
}

// ─── Bulk stock update from CSV ───────────────────────────────────────────────

export type BulkStockRow = { sku: string; stock: number };

/** Process a list of `{ sku, stock }` pairs.
 *  Updates each matching variant and triggers back-in-stock alerts for any that became available. */
export async function bulkUpdateStock(rows: BulkStockRow[]): Promise<{ updated: number; skipped: string[] }> {
  const allProducts = await productRepository.listAll();

  // Build a map from SKU → { productId, sku }
  const skuMap = new Map<string, { productId: string; sku: string }>();
  for (const product of allProducts) {
    for (const v of product.variants) {
      skuMap.set(v.sku, { productId: product.id, sku: v.sku });
    }
  }

  let updated = 0;
  const skipped: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      const entry = skuMap.get(row.sku);
      if (!entry) {
        skipped.push(row.sku);
        return;
      }
      await productRepository.setVariantStock(entry.productId, entry.sku, row.stock);
      updated++;

      // Notify back-in-stock subscribers if this variant now has stock
      if (row.stock > 0) {
        await triggerBackInStockNotifications(entry.productId, entry.sku);
      }
    })
  );

  return { updated, skipped };
}
