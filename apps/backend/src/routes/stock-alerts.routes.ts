import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { registerStockAlertController } from "../controllers/inventory.controller";

export const stockAlertsRouter: ExpressRouter = Router();

// Public — no auth required; rate-limited by the global limiter
stockAlertsRouter.post("/", registerStockAlertController);
