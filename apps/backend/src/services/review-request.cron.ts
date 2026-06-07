import cron from "node-cron";
import { hasMongoConnection } from "../config/env";
import { OrderModel } from "../models/order.model";
import { reviewRepository } from "../repositories/review.repository";
import { userRepository } from "../repositories/user.repository";
import { sendReviewRequestEmail } from "./email.service";
import { logger } from "../lib/logger";

/**
 * Runs daily at 10:00 UTC.
 * Finds orders delivered ~7 days ago that haven't had a review request sent.
 * Sends a review request email and marks the order so it won't be re-emailed.
 */
export function startReviewRequestCron(): void {
  cron.schedule("0 10 * * *", async () => {
    if (!hasMongoConnection) return;
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      // Use a generous lookback (21 days) so server restarts / deploy gaps never
      // cause orders to fall through the crack. reviewEmailSentAt guards duplicates.
      const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

      const orders = await OrderModel.find({
        status: "delivered",
        reviewEmailSentAt: { $exists: false },
        // Prefer deliveredAt (set since S42 bug fix); fall back to updatedAt for
        // older orders that pre-date the deliveredAt stamp.
        $or: [
          { deliveredAt: { $gte: twentyOneDaysAgo.toISOString(), $lte: sevenDaysAgo.toISOString() } },
          { deliveredAt: { $exists: false }, updatedAt: { $gte: twentyOneDaysAgo.toISOString(), $lte: sevenDaysAgo.toISOString() } }
        ]
      }).lean();

      logger.info({ count: orders.length }, "[review-cron] Processing review request emails");

      for (const order of orders) {
        try {
          const orderId = String(order._id);

          // If customer already reviewed every product, skip email but mark as handled
          const existingReviews = await reviewRepository.findByCustomer(String(order.customerId));
          const reviewedProductIds = new Set(existingReviews.map((r) => r.productId));
          const items = (order as unknown as { items: Array<{ productId: string; title: string }> }).items ?? [];
          const unreviewed = items.filter((i) => !reviewedProductIds.has(i.productId));

          // Mark handled either way so the cron never revisits this order
          await OrderModel.updateOne({ _id: order._id }, { $set: { reviewEmailSentAt: new Date().toISOString() } });

          if (unreviewed.length === 0) continue;

          const customer = await userRepository.findById(String(order.customerId));
          if (!customer?.email) continue;

          const orderNum = (order as unknown as { orderNumber?: string }).orderNumber ?? orderId.slice(-6).toUpperCase();

          await sendReviewRequestEmail(
            { orderNumber: orderNum, items: unreviewed },
            customer.email,
            customer.name ?? "there"
          );

          logger.info({ orderId, email: customer.email }, "[review-cron] Review request email sent");
        } catch (err) {
          logger.error({ err, orderId: order._id }, "[review-cron] Failed for order");
        }
      }
    } catch (err) {
      logger.error({ err }, "[review-cron] Cron run failed");
    }
  });

  logger.info("[review-cron] Started — runs daily at 10:00 UTC");
}
