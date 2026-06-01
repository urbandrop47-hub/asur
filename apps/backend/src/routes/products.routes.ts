import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getProductController, listProductsController } from "../controllers/product.controller";
import { listProductReviewsController } from "../controllers/review.controller";

export const productsRouter: ExpressRouter = Router();

productsRouter.get("/", listProductsController);
productsRouter.get("/:slug", getProductController);
productsRouter.get("/:slug/reviews", listProductReviewsController);
