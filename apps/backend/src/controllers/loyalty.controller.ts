import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { loyaltyRepository, EARN_RATE, MIN_REDEEM, REDEEM_RATE } from "../repositories/loyalty.repository";
import { referralRepository } from "../repositories/referral.repository";

export const getLoyaltyController: RequestHandler = asyncHandler(async (_req, res) => {
  const userId: string = res.locals.user.id; // use 'id', not '_id' — UserProfile has no _id field

  const [account, transactions, referral] = await Promise.all([
    loyaltyRepository.getOrCreate(userId),
    loyaltyRepository.getTransactions(userId),
    referralRepository.getOrCreate(userId)
  ]);

  res.json({
    success: true,
    data: {
      account,
      transactions,
      referralCode: referral.code,
      referralUseCount: referral.usedBy.length,
      earnRate: EARN_RATE,   // use constant, not magic number
      redeemRate: REDEEM_RATE,
      minRedeem: MIN_REDEEM
    }
  });
});

export const getLoyaltyBalanceController: RequestHandler = asyncHandler(async (_req, res) => {
  const userId: string = res.locals.user.id;
  const account = await loyaltyRepository.getAccount(userId);
  const points = account?.points ?? 0;

  res.json({ success: true, data: { points, redeemRate: REDEEM_RATE, minRedeem: MIN_REDEEM } });
});
