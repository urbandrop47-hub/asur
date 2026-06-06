import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireSession } from "../middlewares/require-session";
import { adminOnlyMiddleware } from "../middlewares/admin-only";
import { sizeRecommendation, generateDescription, visualSearch } from "../controllers/ai.controller";

export const aiRouter: ExpressRouter = Router();

// Public (rate-limited by global limiter)
aiRouter.post("/size-rec", sizeRecommendation);
aiRouter.post("/visual-search", visualSearch);

// Admin only
aiRouter.post("/description-gen", requireSession, adminOnlyMiddleware, generateDescription);
