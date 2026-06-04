import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getSizeChartController } from "../controllers/size-chart.controller";

export const sizeChartRouter: ExpressRouter = Router();

// Public — used by PDP size guide modal
sizeChartRouter.get("/:category", getSizeChartController);
