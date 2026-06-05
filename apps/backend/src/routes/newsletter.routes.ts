import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
  subscribeNewsletter,
  confirmNewsletter,
  unsubscribeNewsletter,
} from "../controllers/newsletter.controller";

export const newsletterRouter: ExpressRouter = Router();

newsletterRouter.post("/subscribe", subscribeNewsletter);
newsletterRouter.get("/confirm", confirmNewsletter);
newsletterRouter.get("/unsubscribe", unsubscribeNewsletter);
