import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { createApp } from "./app";
import { initSentry } from "./lib/sentry";
import { logger } from "./lib/logger";
import { startAbandonedCartCron } from "./services/abandoned-cart.cron";
import { startReviewRequestCron } from "./services/review-request.cron";

export async function startServer() {
  initSentry();
  await connectDatabase();

  startAbandonedCartCron();
  startReviewRequestCron();

  const app = createApp();
  app.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`asur-backend listening on 0.0.0.0:${env.PORT}`);
  });
}
