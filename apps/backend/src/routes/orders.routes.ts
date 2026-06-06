import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { cancelOrderController, createOrderController, getOrderController, listOrdersController } from "../controllers/order.controller";
import { requestReturnController, listMyReturnsController } from "../controllers/return.controller";
import { requireSession } from "../middlewares/require-session";

export const ordersRouter: ExpressRouter = Router();

// POST /orders — guest checkout allowed (session optional, guestPhone in body)
ordersRouter.post("/", createOrderController);
// GET /:id — session OR ?guestPhone query param (session optional)
ordersRouter.get("/:id", getOrderController);

// All remaining routes require a valid session
ordersRouter.use(requireSession);
ordersRouter.get("/", listOrdersController);
ordersRouter.get("/returns", listMyReturnsController);
ordersRouter.post("/:id/cancel", cancelOrderController);
ordersRouter.post("/:id/return", requestReturnController);
