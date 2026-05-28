import { Router } from "express";
import { getProductController, listProductsController } from "../controllers/product.controller";

export const productsRouter = Router();

productsRouter.get("/", listProductsController);
productsRouter.get("/:slug", getProductController);
