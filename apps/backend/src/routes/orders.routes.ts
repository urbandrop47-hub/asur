import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createOrderController, getOrderController, listOrdersController } from "../controllers/order.controller";
import { requireSession } from "../middlewares/require-session";

export const ordersRouter: ExpressRouter = Router();

ordersRouter.use(requireSession); // all order routes require a valid session

ordersRouter.get("/", listOrdersController);
ordersRouter.post("/", createOrderController);
ordersRouter.get("/:id", getOrderController);
