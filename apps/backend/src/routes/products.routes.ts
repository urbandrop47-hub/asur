import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getProductController, listProductsController } from "../controllers/product.controller";

export const productsRouter: ExpressRouter = Router();

productsRouter.get("/", listProductsController);
productsRouter.get("/:slug", getProductController);
