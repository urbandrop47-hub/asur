import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { AppError } from "../lib/errors";
import { wishlistRepository } from "../repositories/wishlist.repository";
import { productRepository } from "../repositories/product.repository";

// GET /api/v1/wishlist — returns wishlist with product details
export const getWishlistController: RequestHandler = asyncHandler(async (req, res) => {
  const customerId: string = res.locals.user.id;
  const entries = await wishlistRepository.listForCustomer(customerId);

  const products = await Promise.all(
    entries.map(async (entry) => {
      const product = await productRepository.findById(entry.productId);
      if (!product || product.status !== "active") return null;
      return {
        productId: entry.productId,
        addedAt: entry.addedAt,
        product
      };
    })
  );

  const items = products.filter(Boolean);
  sendSuccess(res, { items }, "Wishlist fetched");
});

// POST /api/v1/wishlist — add a product
export const addToWishlistController: RequestHandler = asyncHandler(async (req, res) => {
  const customerId: string = res.locals.user.id;
  const { productId } = z.object({ productId: z.string().min(1) }).parse(req.body);

  const product = await productRepository.findById(productId);
  if (!product || product.status !== "active") {
    throw new AppError(404, "Product not found");
  }

  const entry = await wishlistRepository.add(customerId, productId);
  sendSuccess(res, { entry, product }, "Added to wishlist", 201);
});

// DELETE /api/v1/wishlist/:productId — remove a product
export const removeFromWishlistController: RequestHandler = asyncHandler(async (req, res) => {
  const customerId: string = res.locals.user.id;
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;

  await wishlistRepository.remove(customerId, productId);
  sendSuccess(res, null, "Removed from wishlist");
});
