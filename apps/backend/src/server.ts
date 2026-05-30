import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { createApp } from "./app";
import { bootstrapSuperAdmin } from "./bootstrap/super-admin";

export async function startServer() {
  await connectDatabase();
  const bootstrapUser = await bootstrapSuperAdmin();
  if (bootstrapUser) {
    console.log(`[backend] bootstrapped super admin for ${bootstrapUser.email ?? bootstrapUser.firebaseUid}`);
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[backend] listening on http://localhost:${env.PORT}`);
  });
}
