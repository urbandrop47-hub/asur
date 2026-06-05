import cron from "node-cron";
import { randomBytes } from "crypto";
import { abandonedCartRepository } from "../repositories/abandoned-cart.repository";
import { CouponModel } from "../models/coupon.model";
import { sendAbandonedCartEmail1, sendAbandonedCartEmail2 } from "./email.service";
import { logger } from "../lib/logger";

function generateCouponCode(): string {
  return `RECOVER${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function createRecoveryCoupon(code: string): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  await CouponModel.create({
    code,
    type: "percent",
    value: 5,
    minOrderValue: 0,
    usageLimit: 1,
    usedCount: 0,
    perCustomerLimit: 1,
    isActive: true,
    expiresAt,
    description: "Abandoned cart recovery — auto-generated",
    createdAt: now,
    updatedAt: now,
  });
}

async function processEmail1(): Promise<void> {
  const carts = await abandonedCartRepository.findForEmail1();
  if (carts.length === 0) return;
  logger.info(`[abandoned-cart] processing ${carts.length} carts for email 1`);

  for (const cart of carts) {
    try {
      await sendAbandonedCartEmail1(cart);
      await abandonedCartRepository.markEmail1Sent(String(cart._id));
    } catch (err) {
      logger.error(err, `[abandoned-cart] email1 failed for cart ${cart._id}`);
    }
  }
}

async function processEmail2(): Promise<void> {
  const carts = await abandonedCartRepository.findForEmail2();
  if (carts.length === 0) return;
  logger.info(`[abandoned-cart] processing ${carts.length} carts for email 2`);

  for (const cart of carts) {
    try {
      // Reuse a saved coupon code from a prior failed attempt to avoid orphaned coupons.
      let couponCode = cart.couponCode;
      if (!couponCode) {
        couponCode = generateCouponCode();
        await createRecoveryCoupon(couponCode);
        // Save code to cart BEFORE sending — if send fails, next retry reuses the same code.
        await abandonedCartRepository.saveCouponCode(String(cart._id), couponCode);
      }
      await sendAbandonedCartEmail2(cart, couponCode);
      // Only mark email2 as sent after successful send so failed sends get retried.
      await abandonedCartRepository.markEmail2Sent(String(cart._id));
    } catch (err) {
      logger.error(err, `[abandoned-cart] email2 failed for cart ${cart._id}`);
    }
  }
}

/** Runs every 5 minutes to check for abandoned carts needing recovery emails. */
export function startAbandonedCartCron(): void {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await processEmail1();
      await processEmail2();
    } catch (err) {
      logger.error(err, "[abandoned-cart] cron tick failed");
    }
  });
  logger.info("[abandoned-cart] recovery cron started (every 5 min)");
}
