import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { cartItemSchema, addressSchema } from "../shared/validations";
import { cancelOrder, createOrder, getOrderById, listOrdersByCustomer } from "../services/order.service";
import { orderRepository } from "../repositories/order.repository";
import { logAudit } from "../repositories/audit-log.repository";

const createOrderBodySchema = z.object({
  items: z.array(cartItemSchema).min(1),
  shippingAddress: addressSchema,
  couponCode: z.string().trim().toUpperCase().optional(),
  loyaltyPointsToRedeem: z.number().int().nonnegative().optional().default(0),
  referralCode: z.string().trim().toUpperCase().optional(),
  giftCardCode: z.string().trim().toUpperCase().optional()
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
  const { items, shippingAddress, couponCode, loyaltyPointsToRedeem, referralCode, giftCardCode } = createOrderBodySchema.parse(req.body);
  const customerId: string = res.locals.user.id;
  const result = await createOrder({ customerId, items, shippingAddress, couponCode, loyaltyPointsToRedeem, referralCode, giftCardCode });
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

// "cancelled" is intentionally excluded — it must go through cancelOrder() in
// order.service.ts which restores stock, loyalty points, coupons, and gift cards.
const bulkOrderStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(["processing", "packed", "shipped", "delivered"])
});

// ── POST /api/v1/admin/orders/bulk-status ────────────────────────────────────
export const bulkOrderStatusController: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = bulkOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const { ids, status } = parsed.data;
  let updated = 0;
  const failed: string[] = [];

  await Promise.all(
    ids.map(async (id) => {
      try {
        const order = await orderRepository.updateStatus(id, status);
        if (!order) {
          failed.push(id);
          return;
        }
        updated++;
      } catch {
        failed.push(id);
      }
    })
  );

  logAudit("order.bulk-status", "order", ids.join(","), req.ip, { status, count: updated });
  sendSuccess(res, { updated, failed }, `${updated} order(s) updated to "${status}"`);
});
