import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { optionalSession } from "../middlewares/optional-session";
import { syncAbandonedCart, convertAbandonedCart } from "../controllers/abandoned-cart.controller";

export const abandonedCartRouter: ExpressRouter = Router();

// Cart sync doesn't require auth — guest checkout is possible
abandonedCartRouter.post("/sync", optionalSession, syncAbandonedCart);
abandonedCartRouter.post("/convert", convertAbandonedCart);
