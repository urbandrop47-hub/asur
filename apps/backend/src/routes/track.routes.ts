import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { publicTrackController } from "../controllers/track.controller";

export const trackRouter: ExpressRouter = Router();

trackRouter.get("/", publicTrackController);
