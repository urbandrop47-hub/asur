import { Router } from "express";
import type { Router as ExpressRouter, Request, Response, NextFunction } from "express";
import { getProductController, listProductsController, relatedProductsController, suggestController } from "../controllers/product.controller";
import { listProductReviewsController } from "../controllers/review.controller";

function swr(maxAge: number, staleWhileRevalidate: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    next();
  };
}

export const productsRouter: ExpressRouter = Router();

productsRouter.get("/", swr(300, 3600), listProductsController);
// /suggest must be registered before /:slug to avoid the slug param swallowing it
productsRouter.get("/suggest", swr(600, 1800), suggestController);
productsRouter.get("/:slug", swr(300, 3600), getProductController);
productsRouter.get("/:slug/related", swr(600, 1800), relatedProductsController);
productsRouter.get("/:slug/reviews", swr(900, 3600), listProductReviewsController);
