import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { adminOnlyMiddleware } from "../middlewares/admin-only";
import {
  acceptAdminInviteController,
  createAdminInviteController,
  createAdminProductController,
  deleteAdminProductController,
  getAdminAccessController,
  getAdminOrderController,
  getAdminProductController,
  listAdminInvitesController,
  listAdminOrdersController,
  listAdminProductsController,
  updateAdminProductController
} from "../controllers/admin.controller";

export const adminRouter: ExpressRouter = Router();

// Invite management
adminRouter.get("/access-model", adminOnlyMiddleware, getAdminAccessController);
adminRouter.get("/invites", adminOnlyMiddleware, listAdminInvitesController);
adminRouter.post("/invites", adminOnlyMiddleware, createAdminInviteController);
adminRouter.post("/invites/accept", acceptAdminInviteController);

// Product management
adminRouter.get("/products", adminOnlyMiddleware, listAdminProductsController);
adminRouter.post("/products", adminOnlyMiddleware, createAdminProductController);
adminRouter.get("/products/:id", adminOnlyMiddleware, getAdminProductController);
adminRouter.patch("/products/:id", adminOnlyMiddleware, updateAdminProductController);
adminRouter.delete("/products/:id", adminOnlyMiddleware, deleteAdminProductController);

// Order monitoring
adminRouter.get("/orders", adminOnlyMiddleware, listAdminOrdersController);
adminRouter.get("/orders/:id", adminOnlyMiddleware, getAdminOrderController);
