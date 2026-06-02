import mongoose from "mongoose";
import { env, hasMongoConnection } from "./env";
import { logger } from "../lib/logger";

let databasePromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase() {
  if (!hasMongoConnection) {
    logger.info("MONGODB_URI not set, using in-memory repositories for local development");
    return null;
  }

  if (!databasePromise) {
    databasePromise = mongoose.connect(env.MONGODB_URI, {
      dbName: "asur"
    });
  }

  await databasePromise;
  return mongoose;
}
