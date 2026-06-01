import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireSession } from "../middlewares/require-session";
import {
  getWishlistController,
  addToWishlistController,
  removeFromWishlistController
} from "../controllers/wishlist.controller";

export const wishlistRouter: ExpressRouter = Router();

wishlistRouter.get("/", requireSession, getWishlistController);
wishlistRouter.post("/", requireSession, addToWishlistController);
wishlistRouter.delete("/:productId", requireSession, removeFromWishlistController);
