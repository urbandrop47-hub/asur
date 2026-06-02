/**
 * Production readiness check — run in Railway console after first deploy:
 *   node dist/scripts/bootstrap-prod.js
 *
 * Confirms the database is reachable and ADMIN_SECRET is set.
 * Admin panel access no longer requires a MongoDB user; just set ADMIN_SECRET
 * in Railway env vars and use it as the password on the admin login screen.
 */

import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { logger } from "../lib/logger";

async function run() {
  logger.info("bootstrap-prod: connecting to database...");
  await connectDatabase();
  logger.info("bootstrap-prod: database connected");

  if (!env.ADMIN_SECRET || env.ADMIN_SECRET === "WE_ARE@ASUR") {
    logger.warn(
      "bootstrap-prod: ADMIN_SECRET is not set or is still the default placeholder. " +
      "Set a strong secret in Railway env vars before going live."
    );
  } else {
    logger.info("bootstrap-prod: ADMIN_SECRET is set ✓");
  }

  logger.info("bootstrap-prod: done — admin panel is accessible at your admin domain");
  process.exit(0);
}

void run().catch((err) => {
  logger.error(err, "bootstrap-prod: failed");
  process.exit(1);
});
