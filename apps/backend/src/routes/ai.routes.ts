import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { adminOnlyMiddleware } from "../middlewares/admin-only";
import { sizeRecommendation, generateDescription, visualSearch } from "../controllers/ai.controller";

export const aiRouter: ExpressRouter = Router();

// Public (rate-limited by global limiter)
aiRouter.post("/size-rec", sizeRecommendation);
aiRouter.post("/visual-search", visualSearch);

// Admin only — authenticated by ADMIN_SECRET Bearer token (same as all other admin routes).
// requireSession (Firebase) is NOT used here because the admin panel uses static secret auth,
// not Firebase session tokens.
aiRouter.post("/description-gen", adminOnlyMiddleware, generateDescription);
