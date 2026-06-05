import { AppError } from "../lib/errors";
import { giftCardRepository } from "../repositories/gift-card.repository";
import type { GiftCardDoc } from "../models/gift-card.model";

export type GiftCardValidationResult = {
  card: GiftCardDoc;
  applicableAmount: number; // INR to be deducted from order total
};

/** Validate a gift card code against an order total.
 *  Throws AppError with a user-facing message on any failure.
 *  Returns the applicable amount (capped at orderTotal). */
export async function validateGiftCard(
  code: string,
  orderTotal: number
): Promise<GiftCardValidationResult> {
  const upper = code.toUpperCase().replace(/-/g, "").trim();
  const card = await giftCardRepository.findByCode(upper);

  if (!card) throw new AppError(404, "Gift card not found");
  if (!card.isActive) throw new AppError(422, "This gift card has been deactivated");
  if (card.balance <= 0) throw new AppError(422, "This gift card has no remaining balance");

  if (card.expiresAt && card.expiresAt.length > 0) {
    if (new Date(card.expiresAt) < new Date()) {
      throw new AppError(422, "This gift card has expired");
    }
  }

  const applicableAmount = Math.min(card.balance, orderTotal);
  return { card, applicableAmount };
}

/** Atomically deduct balance. Returns false if a concurrent order exhausted the balance. */
export async function applyGiftCard(code: string, amount: number): Promise<boolean> {
  return giftCardRepository.deductBalance(code, amount);
}

/** Restore balance on order cancellation. */
export async function restoreGiftCard(code: string, amount: number): Promise<void> {
  return giftCardRepository.restoreBalance(code, amount);
}
