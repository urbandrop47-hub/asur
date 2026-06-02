import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createOrderController, getOrderController, listOrdersController } from "../controllers/order.controller";
import { requestReturnController, listMyReturnsController } from "../controllers/return.controller";
import { requireSession } from "../middlewares/require-session";

export const ordersRouter: ExpressRouter = Router();

ordersRouter.use(requireSession); // all order routes require a valid session

ordersRouter.get("/", listOrdersController);
ordersRouter.post("/", createOrderController);
ordersRouter.get("/returns", listMyReturnsController);
ordersRouter.get("/:id", getOrderController);
ordersRouter.post("/:id/return", requestReturnController);
