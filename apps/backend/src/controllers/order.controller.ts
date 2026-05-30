import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { createOrder, listOrders } from "../services/order.service";
import { createOrderSchema } from "../validators/order.validators";

export const createOrderController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = createOrderSchema.parse(req.body);
  const result = await createOrder(payload);
  sendSuccess(res, result, "Order created", 201);
});

export const listOrdersController: RequestHandler = asyncHandler(async (_req, res) => {
  const orders = await listOrders();
  sendSuccess(res, orders, "Orders fetched");
});
