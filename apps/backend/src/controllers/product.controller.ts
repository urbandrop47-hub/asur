import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { getProductBySlug, listProducts } from "../services/product.service";

export const listProductsController: RequestHandler = asyncHandler(async (_req, res) => {
  const products = await listProducts();
  sendSuccess(res, products, "Products fetched");
});

export const getProductController: RequestHandler = asyncHandler(async (req, res) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const product = await getProductBySlug(slug);
  sendSuccess(res, product, product ? "Product fetched" : "Product not found");
});
