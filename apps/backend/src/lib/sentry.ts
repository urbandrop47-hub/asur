import * as Sentry from "@sentry/node";
import { env } from "../config/env";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    integrations: [Sentry.mongooseIntegration()]
  });
}

export { Sentry };
