import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { adminOnlyMiddleware } from "../middlewares/admin-only";
import {
  getAnalyticsController,
  getRevenueChartController,
  exportOrdersCsvController
} from "../controllers/analytics.controller";

export const analyticsRouter: ExpressRouter = Router();

analyticsRouter.get("/", adminOnlyMiddleware, getAnalyticsController);
analyticsRouter.get("/revenue-chart", adminOnlyMiddleware, getRevenueChartController);
analyticsRouter.get("/export-csv", adminOnlyMiddleware, exportOrdersCsvController);
