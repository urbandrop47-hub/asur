import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
  createSessionController,
  listAddressesController,
  meController,
  saveAddressController
} from "../controllers/auth.controller";
import { requireSession } from "../middlewares/require-session";

export const authRouter: ExpressRouter = Router();

authRouter.post("/session", createSessionController);
authRouter.get("/me", requireSession, meController);
authRouter.get("/addresses", requireSession, listAddressesController);
authRouter.post("/addresses", requireSession, saveAddressController);
