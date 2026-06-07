import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { hasMongoConnection } from "../config/env";
import { SiteConfigModel, makeDefaultConfig, type ISiteConfig } from "../models/site-config.model";

// In-memory store for dev without MongoDB — initialised fresh (not at import time)
let mockConfig: Omit<ISiteConfig, "_id"> = makeDefaultConfig();

async function getConfig(): Promise<Omit<ISiteConfig, "_id">> {
  if (hasMongoConnection) {
    const doc = await SiteConfigModel.findById("singleton").lean<ISiteConfig>().exec();
    return doc ?? makeDefaultConfig();
  }
  return mockConfig;
}

// ── GET /api/v1/config/public ─────────────────────────────────────────────────
export const getPublicConfigController: RequestHandler = asyncHandler(async (_req, res) => {
  const config = await getConfig();
  // Only expose safe fields — never leak internal settings
  sendSuccess(res, {
    announcementBar: config.announcementBar,
    freeShippingThreshold: config.freeShippingThreshold,
    shippingFee: config.shippingFee,
    gstRate: config.gstRate,
    brandReel: config.brandReel?.isActive ? config.brandReel : undefined
  }, "Config fetched");
});

// ── GET /api/v1/admin/config ──────────────────────────────────────────────────
export const getAdminConfigController: RequestHandler = asyncHandler(async (_req, res) => {
  const config = await getConfig();
  sendSuccess(res, config, "Config fetched");
});

const patchConfigSchema = z.object({
  announcementBar: z.object({
    text:     z.string().min(1).max(200),
    link:     z.string().optional(),
    bgColor:  z.string().min(1).max(50),
    isActive: z.boolean()
  }).optional(),
  freeShippingThreshold: z.coerce.number().nonnegative().max(100000).optional(),
  shippingFee:           z.coerce.number().nonnegative().max(10000).optional(),
  gstRate:               z.coerce.number().min(0).max(1).optional(),
  gstin:                 z.string().max(15).optional(),
  businessName:          z.string().max(200).optional(),
  businessAddress:       z.string().max(500).optional(),
  brandReel: z.object({
    url:      z.string().url(),
    poster:   z.string().url().optional(),
    headline: z.string().max(120).optional(),
    isActive: z.boolean()
  }).optional()
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field required" });

// ── PATCH /api/v1/admin/config ────────────────────────────────────────────────
export const updateAdminConfigController: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = patchConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Invalid config", errors: parsed.error.flatten() });
    return;
  }

  const now = new Date().toISOString();

  if (hasMongoConnection) {
    const updateFields: Record<string, unknown> = { updatedAt: now };
    if (parsed.data.announcementBar) {
      updateFields["announcementBar.text"]     = parsed.data.announcementBar.text;
      updateFields["announcementBar.link"]     = parsed.data.announcementBar.link;
      updateFields["announcementBar.bgColor"]  = parsed.data.announcementBar.bgColor;
      updateFields["announcementBar.isActive"] = parsed.data.announcementBar.isActive;
    }
    if (parsed.data.freeShippingThreshold !== undefined) updateFields.freeShippingThreshold = parsed.data.freeShippingThreshold;
    if (parsed.data.shippingFee !== undefined) updateFields.shippingFee = parsed.data.shippingFee;
    if (parsed.data.gstRate !== undefined) updateFields.gstRate = parsed.data.gstRate;
    if (parsed.data.gstin !== undefined) updateFields.gstin = parsed.data.gstin;
    if (parsed.data.businessName !== undefined) updateFields.businessName = parsed.data.businessName;
    if (parsed.data.businessAddress !== undefined) updateFields.businessAddress = parsed.data.businessAddress;
    if (parsed.data.brandReel !== undefined) {
      // Use dot-notation keys so MongoDB $set only touches the provided sub-fields,
      // instead of replacing the entire subdocument (which would wipe poster/headline).
      updateFields["brandReel.url"]      = parsed.data.brandReel.url;
      updateFields["brandReel.isActive"] = parsed.data.brandReel.isActive;
      if (parsed.data.brandReel.poster !== undefined)   updateFields["brandReel.poster"]   = parsed.data.brandReel.poster;
      if (parsed.data.brandReel.headline !== undefined) updateFields["brandReel.headline"] = parsed.data.brandReel.headline;
    }

    const doc = await SiteConfigModel.findByIdAndUpdate(
      "singleton",
      { $set: updateFields },
      { upsert: true, new: true }
    ).lean<ISiteConfig>().exec();
    sendSuccess(res, doc, "Config updated");
    return;
  }

  // Mock
  if (parsed.data.announcementBar) mockConfig.announcementBar = parsed.data.announcementBar;
  if (parsed.data.freeShippingThreshold !== undefined) mockConfig.freeShippingThreshold = parsed.data.freeShippingThreshold;
  if (parsed.data.shippingFee !== undefined) mockConfig.shippingFee = parsed.data.shippingFee;
  if (parsed.data.gstRate !== undefined) mockConfig.gstRate = parsed.data.gstRate;
  if (parsed.data.gstin !== undefined) mockConfig.gstin = parsed.data.gstin;
  if (parsed.data.businessName !== undefined) mockConfig.businessName = parsed.data.businessName;
  if (parsed.data.businessAddress !== undefined) mockConfig.businessAddress = parsed.data.businessAddress;
  if (parsed.data.brandReel !== undefined) mockConfig.brandReel = parsed.data.brandReel;
  mockConfig.updatedAt = now;
  sendSuccess(res, mockConfig, "Config updated (mock)");
});
