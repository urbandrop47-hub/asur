import { Router } from "express";
import { createSessionController, meController } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/session", createSessionController);
authRouter.get("/me", meController);
