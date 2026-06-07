import { Router } from "express";
import type { Router as ExpressRouter, Request, Response, NextFunction } from "express";
import {
  listArticlesController,
  getArticleBySlugController,
  getDropBySlugController,
  getLatestArticlesController,
  getRelatedArticlesController,
} from "../controllers/article.controller";
import { verifyDropAccessController } from "../controllers/product.controller";

function swr(maxAge: number, staleWhileRevalidate: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    next();
  };
}

export const articleRouter: ExpressRouter = Router();

articleRouter.get("/", swr(600, 3600), listArticlesController);
articleRouter.get("/latest", swr(900, 3600), getLatestArticlesController);
articleRouter.get("/drops/:slug", swr(900, 7200), getDropBySlugController);
articleRouter.post("/drops/:slug/access", verifyDropAccessController);
articleRouter.get("/:slug", swr(900, 7200), getArticleBySlugController);
articleRouter.get("/:slug/related", swr(600, 3600), getRelatedArticlesController);
