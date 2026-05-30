import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { adminOnlyMiddleware } from "../middlewares/admin-only";
import {
  acceptAdminInviteController,
  createAdminInviteController,
  getAdminAccessController,
  listAdminInvitesController
} from "../controllers/admin.controller";

export const adminRouter: ExpressRouter = Router();

adminRouter.get("/access-model", adminOnlyMiddleware, getAdminAccessController);
adminRouter.get("/invites", adminOnlyMiddleware, listAdminInvitesController);
adminRouter.post("/invites", adminOnlyMiddleware, createAdminInviteController);
adminRouter.post("/invites/accept", acceptAdminInviteController);
