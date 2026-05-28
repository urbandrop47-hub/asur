import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { createApp } from "./app";

export async function startServer() {
  await connectDatabase();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[backend] listening on http://localhost:${env.PORT}`);
  });
}
