import { startServer } from "./server";

void startServer().catch((error) => {
  console.error("[backend] failed to start", error);
  process.exit(1);
});
