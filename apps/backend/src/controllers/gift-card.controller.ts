import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { giftCardRepository } from "../repositories/gift-card.repository";
import { validateGiftCard } from "../services/gift-card.service";
import { sendGiftCardEmail } from "../services/email.service";
import { userRepository } from "../repositories/user.repository";

// ─── Customer: validate gift card ────────────────────────────

const validateBodySchema = z.object({
  code: z.string().trim().min(1),
  orderTotal: z.number().positive()
});

export const validateGiftCardController: RequestHandler = asyncHandler(async (req, res) => {
  const { code, orderTotal } = validateBodySchema.parse(req.body);
  const result = await validateGiftCard(code, orderTotal);
  sendSuccess(res, {
    code: result.card.code,
    balance: result.card.balance,
    applicableAmount: result.applicableAmount
  }, "Gift card valid");
});

// ─── Customer: list my gift cards ─────────────────────────────

export const listMyGiftCardsController: RequestHandler = asyncHandler(async (_req, res) => {
  const customerId: string = res.locals.user.id;
  const email: string = res.locals.user.email ?? "";

  const [purchased, received] = await Promise.all([
    giftCardRepository.listByPurchaser(customerId),
    email ? giftCardRepository.listByRecipientEmail(email) : Promise.resolve([])
  ]);

  // Received excludes cards the customer also purchased (show in purchased only)
  const purchasedIds = new Set(purchased.map((c) => c.id));
  const receivedOnly = received.filter((c) => !purchasedIds.has(c.id));

  sendSuccess(res, { purchased, received: receivedOnly }, "Gift cards fetched");
});

// ─── Admin: list all gift cards ───────────────────────────────

export const listAdminGiftCardsController: RequestHandler = asyncHandler(async (_req, res) => {
  const cards = await giftCardRepository.list();
  sendSuccess(res, { cards }, "Gift cards fetched");
});

// ─── Admin: create gift card (manual issue) ───────────────────

const adminCreateBodySchema = z.object({
  amount: z.number().int().positive(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().trim().optional(),
  message: z.string().trim().optional(),
  expiresAt: z.string().optional()
});

export const adminCreateGiftCardController: RequestHandler = asyncHandler(async (req, res) => {
  const body = adminCreateBodySchema.parse(req.body);
  const card = await giftCardRepository.create({
    initialAmount: body.amount,
    recipientEmail: body.recipientEmail,
    recipientName: body.recipientName,
    message: body.message,
    expiresAt: body.expiresAt
  });

  // Send delivery email if recipient supplied
  if (body.recipientEmail) {
    void sendGiftCardEmail({
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName ?? "there",
      senderName: "ASUR Team",
      code: card.code,
      amount: card.initialAmount,
      message: body.message,
      expiresAt: card.expiresAt
    });
  }

  sendSuccess(res, { card }, "Gift card created", 201);
});

// ─── Admin: deactivate / update gift card ────────────────────

const adminUpdateBodySchema = z.object({
  isActive: z.boolean().optional(),
  balance: z.number().nonnegative().optional(),
  expiresAt: z.string().optional()
});

export const adminUpdateGiftCardController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updates = adminUpdateBodySchema.parse(req.body);
  // Convert YYYY-MM-DD date input to ISO string if needed
  if (updates.expiresAt && updates.expiresAt.length === 10) {
    updates.expiresAt = new Date(updates.expiresAt + "T23:59:59.000Z").toISOString();
  }
  const card = await giftCardRepository.update(id, updates);
  if (!card) {
    res.status(404).json({ success: false, message: "Gift card not found" });
    return;
  }
  sendSuccess(res, { card }, "Gift card updated");
});

// ─── Admin: adjust balance (CS credit / correction) ──────────

const adjustBalanceBodySchema = z.object({
  delta: z.number().int().refine((v) => v !== 0, "delta must be non-zero"),
  reason: z.string().trim().min(1, "Reason is required")
});

export const adminAdjustBalanceController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { delta, reason } = adjustBalanceBodySchema.parse(req.body);
  const result = await giftCardRepository.adjustBalance(id, delta);
  if (!result.card) {
    res.status(404).json({ success: false, message: "Gift card not found" });
    return;
  }
  console.info(`[admin] gift card ${result.card.code} balance adjusted by ${delta} (reason: ${reason}) — ${result.previousBalance} → ${result.newBalance}`);
  sendSuccess(res, { card: result.card, previousBalance: result.previousBalance, newBalance: result.newBalance }, "Balance adjusted");
});

// ─── Admin: resend delivery email ─────────────────────────────

export const adminResendEmailController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const card = await giftCardRepository.findById(id);
  if (!card) {
    res.status(404).json({ success: false, message: "Gift card not found" });
    return;
  }
  if (!card.recipientEmail) {
    res.status(422).json({ success: false, message: "No recipient email on this gift card" });
    return;
  }
  await sendGiftCardEmail({
    recipientEmail: card.recipientEmail,
    recipientName: card.recipientName ?? "there",
    senderName: "ASUR Team",
    code: card.code,
    amount: card.initialAmount,
    message: card.message,
    expiresAt: card.expiresAt
  });
  sendSuccess(res, {}, "Delivery email resent");
});

// ─── Customer: purchase gift card ─────────────────────────────

const purchaseBodySchema = z.object({
  amount: z.number().int().min(100).max(50000),
  recipientEmail: z.string().email(),
  recipientName: z.string().trim().optional(),
  message: z.string().trim().max(300).optional()
});

export const purchaseGiftCardController: RequestHandler = asyncHandler(async (req, res) => {
  const body = purchaseBodySchema.parse(req.body);
  const customerId: string = res.locals.user.id;

  // Get purchaser name for the delivery email
  const purchaser = await userRepository.findById(customerId);
  const senderName = purchaser?.name ?? "A friend";

  const card = await giftCardRepository.create({
    initialAmount: body.amount,
    purchasedBy: customerId,
    recipientEmail: body.recipientEmail,
    recipientName: body.recipientName,
    message: body.message
  });

  // Fire-and-forget delivery email
  void sendGiftCardEmail({
    recipientEmail: body.recipientEmail,
    recipientName: body.recipientName ?? "there",
    senderName,
    code: card.code,
    amount: card.initialAmount,
    message: body.message,
    expiresAt: card.expiresAt
  });

  sendSuccess(res, { card }, "Gift card purchased", 201);
});

// ─── Customer: get balance by code (public) ───────────────────

export const getGiftCardBalanceController: RequestHandler = asyncHandler(async (req, res) => {
  const rawCode = Array.isArray(req.params.code) ? req.params.code[0] : (req.params.code ?? "");
  const code = rawCode.toUpperCase().replace(/-/g, "").trim();
  const card = await giftCardRepository.findByCode(code);
  if (!card || !card.isActive) {
    res.status(404).json({ success: false, message: "Gift card not found" });
    return;
  }
  sendSuccess(res, { balance: card.balance, initialAmount: card.initialAmount, expiresAt: card.expiresAt }, "Balance fetched");
});
