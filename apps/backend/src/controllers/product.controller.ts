import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { getProductBySlug, listProducts } from "../services/product.service";

export const listProductsController = asyncHandler(async (_req: Request, res: Response) => {
  const products = await listProducts();
  sendSuccess(res, products, "Products fetched");
});

export const getProductController = asyncHandler(async (req: Request, res: Response) => {
  const product = await getProductBySlug(req.params.slug);
  sendSuccess(res, product, product ? "Product fetched" : "Product not found");
});
