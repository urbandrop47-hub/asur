import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getProductController, listProductsController, relatedProductsController, suggestController } from "../controllers/product.controller";
import { listProductReviewsController } from "../controllers/review.controller";

export const productsRouter: ExpressRouter = Router();

productsRouter.get("/", listProductsController);
// /suggest must be registered before /:slug to avoid the slug param swallowing it
productsRouter.get("/suggest", suggestController);
productsRouter.get("/:slug", getProductController);
productsRouter.get("/:slug/related", relatedProductsController);
productsRouter.get("/:slug/reviews", listProductReviewsController);
