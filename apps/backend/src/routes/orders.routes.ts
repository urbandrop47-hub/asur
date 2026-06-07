import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { cancelOrderController, createOrderController, getOrderController, listOrdersController } from "../controllers/order.controller";
import { requestReturnController, listMyReturnsController } from "../controllers/return.controller";
import { requireSession } from "../middlewares/require-session";

export const ordersRouter: ExpressRouter = Router();

// POST /orders — guest checkout allowed (session optional, guestPhone in body)
ordersRouter.post("/", createOrderController);

// ⚠️  Static sub-paths MUST be registered before /:id — otherwise Express
//     matches GET /returns as /:id with id="returns" and the real handler is
//     never reached. These routes each carry an inline requireSession guard.
ordersRouter.get("/", requireSession, listOrdersController);
ordersRouter.get("/returns", requireSession, listMyReturnsController);
ordersRouter.post("/:id/cancel", requireSession, cancelOrderController);
ordersRouter.post("/:id/return", requireSession, requestReturnController);

// GET /:id — session optional: controller handles session OR ?guestPhone param.
// Registered last so the static paths above take precedence.
ordersRouter.get("/:id", getOrderController);
