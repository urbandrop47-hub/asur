import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { captureMockPayment, createRazorpayOrder, verifyPaymentSignature } from "../services/payment.service";
import { paymentCreateOrderSchema, paymentVerificationSchema } from "../validators/payment.validators";
import { markOrderPaid } from "../services/order.service";

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
  const isValid = verifyPaymentSignature(payload);

  if (!isValid) {
    res.status(400).json({ success: false, message: "Invalid payment signature" });
    return;
  }

  // Mark order paid and create vendor task
  await markOrderPaid(payload.orderId);

  const captured = await captureMockPayment(payload.orderId, 0);
  sendSuccess(res, { ...captured, orderId: payload.orderId }, "Payment verified");
});
