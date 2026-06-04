import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { hasMongoConnection } from "../config/env";
import { SizeChartModel, type SizeChartRow } from "../models/size-chart.model";

// ── Default charts served when no MongoDB record exists for a category ─────────
const DEFAULT_ROWS: SizeChartRow[] = [
  { size: "XS",  chest: 84,  waist: 68, hip: 90,  length: 65 },
  { size: "S",   chest: 88,  waist: 72, hip: 94,  length: 67 },
  { size: "M",   chest: 92,  waist: 76, hip: 98,  length: 69 },
  { size: "L",   chest: 96,  waist: 80, hip: 102, length: 71 },
  { size: "XL",  chest: 100, waist: 84, hip: 106, length: 73 },
  { size: "XXL", chest: 106, waist: 90, hip: 112, length: 75 }
];

// In-memory mock for dev without MongoDB
const mockCharts: Record<string, { category: string; unit: string; rows: SizeChartRow[]; updatedAt: string }> = {};

// ── GET /api/v1/size-guide/:category ─────────────────────────────────────────
export const getSizeChartController: RequestHandler = asyncHandler(async (req, res) => {
  const category = String(req.params.category).toLowerCase();

  if (hasMongoConnection) {
    const chart = await SizeChartModel.findOne({ category }).lean().exec()
      ?? await SizeChartModel.findOne({ category: "default" }).lean().exec();
    if (chart) {
      sendSuccess(res, chart, "Size chart fetched");
      return;
    }
  } else {
    const chart = mockCharts[category] ?? mockCharts["default"];
    if (chart) { sendSuccess(res, chart, "Size chart fetched"); return; }
  }

  // Fallback — serve universal default chart
  sendSuccess(res, {
    category,
    unit: "cm",
    rows: DEFAULT_ROWS,
    updatedAt: new Date().toISOString()
  }, "Size chart fetched (default)");
});

// ── GET /api/v1/admin/size-guide ─────────────────────────────────────────────
export const listSizeChartsController: RequestHandler = asyncHandler(async (_req, res) => {
  if (hasMongoConnection) {
    const charts = await SizeChartModel.find({}).lean().exec();
    sendSuccess(res, charts, "Size charts listed");
    return;
  }
  sendSuccess(res, Object.values(mockCharts), "Size charts listed");
});

const rowSchema = z.object({
  size:   z.string().min(1),
  chest:  z.number().positive(),
  waist:  z.number().positive(),
  hip:    z.number().positive(),
  length: z.number().positive()
});

const chartBodySchema = z.object({
  unit: z.enum(["cm", "in"]).optional().default("cm"),
  rows: z.array(rowSchema).min(1)
});

// ── POST /api/v1/admin/size-guide/:category ───────────────────────────────────
export const upsertSizeChartController: RequestHandler = asyncHandler(async (req, res) => {
  const category = String(req.params.category).toLowerCase();
  const parsed = chartBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Invalid size chart data", errors: parsed.error.flatten() });
    return;
  }
  const now = new Date().toISOString();

  if (hasMongoConnection) {
    const chart = await SizeChartModel.findOneAndUpdate(
      { category },
      { $set: { ...parsed.data, category, updatedAt: now } },
      { upsert: true, new: true }
    ).lean().exec();
    sendSuccess(res, chart, "Size chart saved");
    return;
  }

  const chart = { category, ...parsed.data, updatedAt: now };
  mockCharts[category] = chart;
  sendSuccess(res, chart, "Size chart saved (mock)");
});

// ── DELETE /api/v1/admin/size-guide/:category ─────────────────────────────────
export const deleteSizeChartController: RequestHandler = asyncHandler(async (req, res) => {
  const category = String(req.params.category).toLowerCase();

  if (hasMongoConnection) {
    await SizeChartModel.deleteOne({ category });
    sendSuccess(res, null, "Size chart deleted");
    return;
  }

  delete mockCharts[category];
  sendSuccess(res, null, "Size chart deleted (mock)");
});
