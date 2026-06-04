import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { cartItemSchema, addressSchema } from "../shared/validations";
import { cancelOrder, createOrder, getOrderById, listOrdersByCustomer } from "../services/order.service";

const createOrderBodySchema = z.object({
  items: z.array(cartItemSchema).min(1),
  shippingAddress: addressSchema,
  couponCode: z.string().trim().toUpperCase().optional()
});

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create an order draft from cart items
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, shippingAddress]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *               shippingAddress:
 *                 $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Order and vendor task created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
export const createOrderController: RequestHandler = asyncHandler(async (req, res) => {
  const { items, shippingAddress, couponCode } = createOrderBodySchema.parse(req.body);
  const customerId: string = res.locals.user.id;
  const result = await createOrder({ customerId, items, shippingAddress, couponCode });
  sendSuccess(res, result, "Order created", 201);
});

export const cancelOrderController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customerId: string = res.locals.user.id;
  const order = await cancelOrder(id, customerId, false);
  sendSuccess(res, { order }, "Order cancelled");
});

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List all orders for the current user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Not authenticated
 */
export const listOrdersController: RequestHandler = asyncHandler(async (_req, res) => {
  const customerId: string = res.locals.user.id;
  const orders = await listOrdersByCustomer(customerId);
  sendSuccess(res, orders, "Orders fetched");
});

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 */
export const getOrderController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customerId: string = res.locals.user.id;
  const order = await getOrderById(id, customerId);

  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  sendSuccess(res, order, "Order fetched");
});
