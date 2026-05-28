import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { createOrder, listOrders } from "../services/order.service";
import { createOrderSchema } from "../validators/order.validators";

export const createOrderController = asyncHandler(async (req: Request, res: Response) => {
  const payload = createOrderSchema.parse(req.body);
  const result = await createOrder(payload);
  sendSuccess(res, result, "Order created", 201);
});

export const listOrdersController = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await listOrders();
  sendSuccess(res, orders, "Orders fetched");
});
