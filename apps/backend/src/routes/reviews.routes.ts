import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireSession } from "../middlewares/require-session";
import {
  createReviewController,
  voteHelpfulController,
  getReviewUploadUrlController
} from "../controllers/review.controller";

export const reviewsRouter: ExpressRouter = Router();

reviewsRouter.post("/", requireSession, createReviewController);
// /upload-url must be before /:id to avoid param swallowing
reviewsRouter.post("/upload-url", requireSession, getReviewUploadUrlController);
reviewsRouter.post("/:id/helpful", requireSession, voteHelpfulController);
