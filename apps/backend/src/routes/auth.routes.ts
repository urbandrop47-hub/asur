import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createSessionController, meController } from "../controllers/auth.controller";

export const authRouter: ExpressRouter = Router();

authRouter.post("/session", createSessionController);
authRouter.get("/me", meController);
