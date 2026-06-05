import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
  listArticlesController,
  getArticleBySlugController,
  getDropBySlugController,
  getLatestArticlesController,
  getRelatedArticlesController,
} from "../controllers/article.controller";

export const articleRouter: ExpressRouter = Router();

articleRouter.get("/", listArticlesController);
articleRouter.get("/latest", getLatestArticlesController);
articleRouter.get("/drops/:slug", getDropBySlugController);
articleRouter.get("/:slug", getArticleBySlugController);
articleRouter.get("/:slug/related", getRelatedArticlesController);
