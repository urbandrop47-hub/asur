import { Router } from "express";
import type { Router as ExpressRouter, Request, Response, NextFunction } from "express";
import { getPublicConfigController } from "../controllers/site-config.controller";

function swr(maxAge: number, staleWhileRevalidate: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    next();
  };
}

export const siteConfigRouter: ExpressRouter = Router();

siteConfigRouter.get("/public", swr(1800, 7200), getPublicConfigController);
