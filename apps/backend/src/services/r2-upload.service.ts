import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { createId } from "../lib/id";

const hasR2 =
  env.R2_ACCESS_KEY.length > 0 &&
  env.R2_SECRET_KEY.length > 0 &&
  env.R2_BUCKET.length > 0 &&
  env.R2_ACCOUNT_ID.length > 0 &&
  env.R2_PUBLIC_URL.length > 0; // required — without it publicUrl would be a relative path

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY,
        secretAccessKey: env.R2_SECRET_KEY,
      },
    });
  }
  return _client;
}

export async function getReviewImageUploadUrl(
  contentType: "image/jpeg" | "image/png" | "image/webp"
): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!hasR2) {
    throw new Error("R2 storage is not configured — set R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_ACCOUNT_ID, R2_PUBLIC_URL");
  }
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `reviews/${createId("img")}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 300 });
  const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  return { uploadUrl, publicUrl };
}
