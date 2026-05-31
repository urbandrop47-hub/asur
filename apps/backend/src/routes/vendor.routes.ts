import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireVendor } from "../middlewares/require-vendor";
import {
  getVendorTaskController,
  listVendorTasksController,
  updateVendorTaskController
} from "../controllers/vendor.controller";

export const vendorRouter: ExpressRouter = Router();

vendorRouter.use(requireVendor);

vendorRouter.get("/tasks", listVendorTasksController);
vendorRouter.get("/tasks/:id", getVendorTaskController);
vendorRouter.patch("/tasks/:id", updateVendorTaskController);
