import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireSession } from "../middlewares/require-session";
import { createReviewController } from "../controllers/review.controller";

export const reviewsRouter: ExpressRouter = Router();

reviewsRouter.post("/", requireSession, createReviewController);
