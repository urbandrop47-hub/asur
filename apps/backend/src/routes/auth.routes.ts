import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
  createSessionController,
  deleteAccountController,
  deleteAddressController,
  dataExportController,
  getEmailPrefsController,
  listAddressesController,
  meController,
  saveAddressController,
  unsubscribeController,
  updateEmailPrefsController,
  updateProfileController
} from "../controllers/auth.controller";
import { requireSession } from "../middlewares/require-session";

export const authRouter: ExpressRouter = Router();

authRouter.post("/session", createSessionController);
authRouter.get("/me", requireSession, meController);
authRouter.patch("/profile", requireSession, updateProfileController);
authRouter.get("/addresses", requireSession, listAddressesController);
authRouter.post("/addresses", requireSession, saveAddressController);
authRouter.delete("/addresses/:index", requireSession, deleteAddressController);

// Email preferences
authRouter.get("/email-preferences", requireSession, getEmailPrefsController);
authRouter.patch("/email-preferences", requireSession, updateEmailPrefsController);

// GDPR
authRouter.get("/data-export", requireSession, dataExportController);
authRouter.delete("/account", requireSession, deleteAccountController);

// Public one-click unsubscribe (token in query param)
authRouter.get("/unsubscribe", unsubscribeController);
