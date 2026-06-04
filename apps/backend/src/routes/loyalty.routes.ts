import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireSession } from "../middlewares/require-session";
import { getLoyaltyController, getLoyaltyBalanceController } from "../controllers/loyalty.controller";

export const loyaltyRouter: ExpressRouter = Router();

loyaltyRouter.get("/", requireSession, getLoyaltyController);
loyaltyRouter.get("/balance", requireSession, getLoyaltyBalanceController);
