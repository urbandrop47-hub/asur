import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireSession } from "../middlewares/require-session";
import {
  validateGiftCardController,
  listMyGiftCardsController,
  getGiftCardBalanceController,
  purchaseGiftCardController
} from "../controllers/gift-card.controller";

export const giftCardRouter: ExpressRouter = Router();

// Public: validate before order creation
giftCardRouter.post("/validate", validateGiftCardController);

// Authenticated: purchase + list
giftCardRouter.post("/purchase", requireSession, purchaseGiftCardController);
giftCardRouter.get("/", requireSession, listMyGiftCardsController);

// Public: check balance by code (must come after /validate and / to avoid route conflicts)
giftCardRouter.get("/:code/balance", getGiftCardBalanceController);
