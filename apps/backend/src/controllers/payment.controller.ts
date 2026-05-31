import type { RequestHandler } from "express";
import type { Order } from "@asur/types";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { capturePayment, createRazorpayOrder, verifyPaymentSignature } from "../services/payment.service";
import { paymentCreateOrderSchema, paymentVerificationSchema } from "../validators/payment.validators";
import { markOrderPaid } from "../services/order.service";
import { orderRepository } from "../repositories/order.repository";

/**
 * @swagger
 * /api/v1/payments/razorpay/order:
 *   post:
 *     summary: Create a Razorpay payment order for a draft order
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount]
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ASUR internal order ID
 *               amount:
 *                 type: integer
 *                 description: Amount in paise
 *     responses:
 *       200:
 *         description: Razorpay order object (or mock order in dev mode)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providerOrderId:
 *                   type: string
 *                   description: Razorpay order ID to pass to the frontend modal
 *                 amount:
 *                   type: integer
 *                 currency:
 *                   type: string
 */
export const createPaymentOrderController: RequestHandler = asyncHandler(async (req, res) => {
  const { orderId, amount } = paymentCreateOrderSchema.parse(req.body);
  const requestingUserId = res.locals.user?.id as string | undefined;

  // Ownership: only the order's owner may create a Razorpay payment intent for it
  const existingOrder = await orderRepository.findByIdAdmin(orderId) as (Order & { providerOrderId?: string }) | null;
  if (!existingOrder) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }
  if (requestingUserId && existingOrder.customerId !== requestingUserId) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }

  const providerOrder = await createRazorpayOrder({ orderId, amount, currency: "INR" });
  sendSuccess(res, providerOrder, "Payment order created");
});

/**
 * @swagger
 * /api/v1/payments/razorpay/verify:
 *   post:
 *     summary: Verify Razorpay payment signature and mark the order as paid
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature]
 *             properties:
 *               orderId:
 *                 type: string
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified, order marked as paid
 *       400:
 *         description: Invalid signature
 */
export const verifyPaymentController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = paymentVerificationSchema.parse(req.body);

  // Look up the order and verify the razorpayOrderId matches what we stored.
  // This prevents a replay attack where an attacker reuses a valid signature
  // from their own paid order to mark a different order as paid.
  const requestingUserId = res.locals.user?.id as string | undefined;

  const order = await orderRepository.findByIdAdmin(payload.orderId) as (Order & { providerOrderId?: string }) | null;
  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  // Ownership: only the customer who placed this order may verify its payment
  if (requestingUserId && order.customerId !== requestingUserId) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }

  if (order.providerOrderId && order.providerOrderId !== payload.razorpayOrderId) {
    res.status(400).json({ success: false, message: "Payment order ID mismatch" });
    return;
  }

  // Idempotent: already verified
  if (order.status === "paid") {
    sendSuccess(res, { order }, "Payment already verified");
    return;
  }

  const isValid = verifyPaymentSignature(payload);
  if (!isValid) {
    res.status(400).json({ success: false, message: "Invalid payment signature" });
    return;
  }

  // Capture the payment record FIRST. If this fails we have no partial state.
  // If markOrderPaid subsequently fails, the payment row exists for reconciliation.
  const captured = await capturePayment({
    orderId: payload.orderId,
    amount: order.total ?? 0,
    providerOrderId: payload.razorpayOrderId,
    providerPaymentId: payload.razorpayPaymentId
  });

  const paidOrder = await markOrderPaid(payload.orderId);

  sendSuccess(res, { order: paidOrder, payment: captured.payment }, "Payment verified");
});
