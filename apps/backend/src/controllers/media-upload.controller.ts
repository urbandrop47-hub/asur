import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { getProductVideoUploadUrl, getProductPosterUploadUrl } from "../services/r2-upload.service";

const videoContentTypeSchema = z.object({
  contentType: z.enum(["video/mp4", "video/webm"])
});

const posterContentTypeSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"])
});

/**
 * POST /api/v1/admin/products/upload-video-url
 * Returns a presigned R2 PUT URL for uploading a product video.
 * Admin-only (catalog:write permission).
 */
export const getProductVideoUploadUrlController: RequestHandler = asyncHandler(async (req, res) => {
  const { contentType } = videoContentTypeSchema.parse(req.body);
  const result = await getProductVideoUploadUrl(contentType);
  sendSuccess(res, result, "Video upload URL generated");
});

/**
 * POST /api/v1/admin/products/upload-poster-url
 * Returns a presigned R2 PUT URL for uploading a video poster image.
 * Admin-only (catalog:write permission).
 */
export const getProductPosterUploadUrlController: RequestHandler = asyncHandler(async (req, res) => {
  const { contentType } = posterContentTypeSchema.parse(req.body);
  const result = await getProductPosterUploadUrl(contentType);
  sendSuccess(res, result, "Poster upload URL generated");
});
