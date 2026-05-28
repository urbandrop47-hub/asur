import { Router } from "express";
import { createOrderController, listOrdersController } from "../controllers/order.controller";

export const ordersRouter = Router();

ordersRouter.get("/", listOrdersController);
ordersRouter.post("/", createOrderController);
