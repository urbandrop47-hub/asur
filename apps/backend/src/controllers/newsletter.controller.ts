import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { newsletterRepository } from "../repositories/newsletter-subscriber.repository";
import { sendNewsletterConfirmEmail } from "../services/email.service";

const subscribeSchema = z.object({
  email: z.string().email(),
  source: z.enum(["footer", "popup", "checkout"]).default("footer"),
});

function parsePositiveLimit(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

export const subscribeNewsletter: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Valid email required" });
    return;
  }

  const { doc, isNew } = await newsletterRepository.subscribe(parsed.data.email, parsed.data.source);

  if (isNew || !doc.confirmedAt) {
    // fire-and-forget confirmation email
    void sendNewsletterConfirmEmail(doc.email, doc.confirmToken).catch(() => {});
  }

  res.json({ success: true, alreadySubscribed: !isNew && !!doc.confirmedAt });
});

export const confirmNewsletter: RequestHandler = asyncHandler(async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;
  if (!token) {
    res.status(400).json({ success: false, message: "Token required" });
    return;
  }

  const doc = await newsletterRepository.confirm(token);
  if (!doc) {
    // Already confirmed or invalid — return 410 so the frontend can redirect accordingly
    res.status(410).json({ success: false, message: "Token invalid or already used" });
    return;
  }

  res.json({ success: true });
});

export const unsubscribeNewsletter: RequestHandler = asyncHandler(async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;
  if (!token) {
    res.status(400).json({ success: false, message: "Token required" });
    return;
  }

  await newsletterRepository.unsubscribe(token);
  res.redirect(302, `${process.env.WEB_BASE_URL ?? "https://asur.in"}/newsletter/unsubscribed`);
});

// ── Admin endpoints ──────────────────────────────────────────────────

export const adminListSubscribers: RequestHandler = asyncHandler(async (req, res) => {
  const page = parsePositiveLimit(req.query.page, 1, Number.POSITIVE_INFINITY);
  const limit = parsePositiveLimit(req.query.limit, 50, 100);
  const { docs, total } = await newsletterRepository.listConfirmed(page, limit);
  res.json({ success: true, data: docs, total, page, limit });
});

export const adminNewsletterStats: RequestHandler = asyncHandler(async (_req, res) => {
  const stats = await newsletterRepository.stats();
  res.json({ success: true, data: stats });
});
