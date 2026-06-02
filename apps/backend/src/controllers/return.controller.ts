import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import {
  requestReturn,
  listReturns,
  getReturnByIdAdmin,
  listReturnsByCustomer,
  approveReturn,
  rejectReturn
} from "../services/return.service";

const returnItemSchema = z.object({
  variantSku: z.string().min(1),
  quantity: z.number().int().positive(),
  reason: z.string().min(3).max(300)
});

const requestReturnBodySchema = z.object({
  items: z.array(returnItemSchema).min(1),
  reason: z.string().min(3).max(500)
});

const adminDecisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  adminNote: z.string().max(500).optional()
});

// ─── Customer endpoints ───────────────────────────────────────

export const requestReturnController: RequestHandler = asyncHandler(async (req, res) => {
  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customerId: string = res.locals.user.id;
  const body = requestReturnBodySchema.parse(req.body);
  const ret = await requestReturn(orderId, customerId, body);
  sendSuccess(res, ret, "Return request submitted", 201);
});

export const listMyReturnsController: RequestHandler = asyncHandler(async (_req, res) => {
  const customerId: string = res.locals.user.id;
  const returns = await listReturnsByCustomer(customerId);
  sendSuccess(res, returns, "Returns fetched");
});

// ─── Admin endpoints ──────────────────────────────────────────

export const listAdminReturnsController: RequestHandler = asyncHandler(async (req, res) => {
  const status = req.query.status as string | undefined;
  const validStatuses = ["requested", "approved", "rejected", "refunded"] as const;
  const filter = validStatuses.includes(status as (typeof validStatuses)[number])
    ? { status: status as (typeof validStatuses)[number] }
    : undefined;
  const returns = await listReturns(filter);
  sendSuccess(res, returns, "Returns fetched");
});

export const getAdminReturnController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const ret = await getReturnByIdAdmin(id);
  if (!ret) {
    res.status(404).json({ success: false, message: "Return not found" });
    return;
  }
  sendSuccess(res, ret, "Return fetched");
});

export const adminDecideReturnController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { action, adminNote } = adminDecisionSchema.parse(req.body);

  const ret = action === "approve"
    ? await approveReturn(id, adminNote)
    : await rejectReturn(id, adminNote);

  sendSuccess(res, ret, `Return ${action === "approve" ? "approved" : "rejected"}`);
});
