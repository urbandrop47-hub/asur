import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().optional().default(""),
  JWT_SECRET: z.string().optional().default(""),
  FIREBASE_PROJECT_ID: z.string().optional().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(""),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),
  RAZORPAY_KEY: z.string().optional().default(""),
  RAZORPAY_SECRET: z.string().optional().default(""),
  R2_ACCESS_KEY: z.string().optional().default(""),
  R2_SECRET_KEY: z.string().optional().default(""),
  R2_BUCKET: z.string().optional().default(""),
  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_PUBLIC_URL: z.string().optional().default("")
});

export const env = envSchema.parse(process.env);
export const hasMongoConnection = env.MONGODB_URI.length > 0;
export const hasFirebaseCredentials =
  env.FIREBASE_PROJECT_ID.length > 0 && env.FIREBASE_CLIENT_EMAIL.length > 0 && env.FIREBASE_PRIVATE_KEY.length > 0;
export const hasRazorpayCredentials = env.RAZORPAY_KEY.length > 0 && env.RAZORPAY_SECRET.length > 0;
