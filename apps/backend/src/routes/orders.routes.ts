import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createOrderController, listOrdersController } from "../controllers/order.controller";

export const ordersRouter: ExpressRouter = Router();

ordersRouter.get("/", listOrdersController);
ordersRouter.post("/", createOrderController);
