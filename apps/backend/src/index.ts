import { startServer } from "./server";
import { logger } from "./lib/logger";

void startServer().catch((error) => {
  logger.error(error, "failed to start backend");
  process.exit(1);
});
