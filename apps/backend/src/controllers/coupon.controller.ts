import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { AppError } from "../lib/errors";
import { couponRepository } from "../repositories/coupon.repository";
import { validateCoupon } from "../services/coupon.service";

// ── Public: POST /api/v1/coupons/validate ───────────────────────────────────
export const validateCouponController: RequestHandler = asyncHandler(async (req, res) => {
  const { code, subtotal } = z.object({
    code: z.string().min(1),
    subtotal: z.number().positive()
  }).parse(req.body);

  // Pass customerId if session exists (optional — for per-customer limit check)
  const customerId: string | undefined = res.locals.user?.id;
  const result = await validateCoupon(code, subtotal, customerId);

  // Flat shape so the web checkout can read `res.data.code`, `res.data.discountAmount` etc. directly
  sendSuccess(res, {
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value,
    description: result.coupon.description,
    discountAmount: result.discountAmount,
    freeShipping: result.freeShipping
  }, "Coupon is valid");
});

// ── Admin: GET /api/v1/admin/coupons ────────────────────────────────────────
export const listCouponsController: RequestHandler = asyncHandler(async (_req, res) => {
  const coupons = await couponRepository.list();
  sendSuccess(res, { coupons }, "Coupons fetched");
});

// ── Admin: POST /api/v1/admin/coupons ───────────────────────────────────────
const createCouponSchema = z.object({
  code: z.string().min(1).max(32).regex(/^[A-Z0-9_-]+$/i, "Code can only contain letters, numbers, _ and -"),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).default(0),
  usageLimit: z.number().int().min(0).default(0),
  perCustomerLimit: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.string().default(""),
  description: z.string().max(200).optional()
});

export const createCouponController: RequestHandler = asyncHandler(async (req, res) => {
  const input = createCouponSchema.parse(req.body);

  // Validate value range for percent type
  if (input.type === "percent" && input.value > 100) {
    throw new AppError(400, "Percent discount cannot exceed 100");
  }

  const existing = await couponRepository.findByCode(input.code);
  if (existing) throw new AppError(409, `Coupon code "${input.code.toUpperCase()}" already exists`);

  const coupon = await couponRepository.create(input);
  sendSuccess(res, { coupon }, "Coupon created", 201);
});

// ── Admin: PATCH /api/v1/admin/coupons/:code ─────────────────────────────────
export const updateCouponController: RequestHandler = asyncHandler(async (req, res) => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const updates = z.object({
    isActive: z.boolean().optional(),
    description: z.string().max(200).optional(),
    usageLimit: z.number().int().min(0).optional(),
    perCustomerLimit: z.number().int().min(0).optional(),
    expiresAt: z.string().optional(),
    value: z.number().min(0).optional(),
    minOrderValue: z.number().min(0).optional()
  }).parse(req.body);

  const coupon = await couponRepository.update(code, updates);
  if (!coupon) throw new AppError(404, "Coupon not found");
  sendSuccess(res, { coupon }, "Coupon updated");
});

// ── Admin: DELETE /api/v1/admin/coupons/:code ────────────────────────────────
export const deleteCouponController: RequestHandler = asyncHandler(async (req, res) => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const deleted = await couponRepository.delete(code);
  if (!deleted) throw new AppError(404, "Coupon not found");
  sendSuccess(res, null, "Coupon deleted");
});
