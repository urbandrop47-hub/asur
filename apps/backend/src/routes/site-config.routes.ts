import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getPublicConfigController } from "../controllers/site-config.controller";

export const siteConfigRouter: ExpressRouter = Router();

siteConfigRouter.get("/public", getPublicConfigController);
