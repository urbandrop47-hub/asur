import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
  createSessionController,
  deleteAddressController,
  listAddressesController,
  meController,
  saveAddressController,
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
