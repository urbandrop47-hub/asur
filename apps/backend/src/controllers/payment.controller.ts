import type { RequestHandler } from "express";
import type { Order } from "@asur/types";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { capturePayment, createRazorpayOrder, verifyPaymentSignature } from "../services/payment.service";
import { paymentCreateOrderSchema, paymentVerificationSchema } from "../validators/payment.validators";
import { markOrderPaid } from "../services/order.service";
import { orderRepository } from "../repositories/order.repository";
import { userRepository } from "../repositories/user.repository";
import { sendPaymentReceiptEmail } from "../services/email.service";

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
  const { orderId } = paymentCreateOrderSchema.parse(req.body);
  const requestingUserId = res.locals.user.id as string;

  // Ownership: only the order's owner may create a Razorpay payment intent for it
  const existingOrder = await orderRepository.findByIdAdmin(orderId) as (Order & { providerOrderId?: string }) | null;
  if (!existingOrder) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }
  if (existingOrder.customerId !== requestingUserId) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }

  // Always derive the Razorpay amount from the server-computed order total — never
  // trust the client-supplied amount, which could be tampered to pay ₹0.01.
  const amountPaise = Math.round((existingOrder.total ?? 0) * 100);
  const providerOrder = await createRazorpayOrder({ orderId, amount: amountPaise, currency: "INR" });
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
  const requestingUserId = res.locals.user.id as string;

  const order = await orderRepository.findByIdAdmin(payload.orderId) as (Order & { providerOrderId?: string }) | null;
  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  // Ownership: only the customer who placed this order may verify its payment
  if (order.customerId !== requestingUserId) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }

  // The Razorpay order must have been created for this ASUR order first.
  // An absent providerOrderId means payment was never initiated — reject immediately
  // to prevent replay of a valid signature from a different order.
  if (!order.providerOrderId) {
    res.status(400).json({ success: false, message: "Payment has not been initiated for this order" });
    return;
  }
  if (order.providerOrderId !== payload.razorpayOrderId) {
    res.status(400).json({ success: false, message: "Payment order ID mismatch" });
    return;
  }

  // Idempotent: only skip if BOTH the order status and paymentStatus are fully
  // settled. If status=paid but paymentStatus is still pending (i.e. markOrderPaid
  // succeeded but capturePayment threw on the first call), fall through and retry.
  if (order.status === "paid" && order.paymentStatus === "captured") {
    sendSuccess(res, { order }, "Payment already verified");
    return;
  }

  const isValid = verifyPaymentSignature(payload);
  if (!isValid) {
    res.status(400).json({ success: false, message: "Invalid payment signature" });
    return;
  }

  // markOrderPaid first — it can throw (404, 409). Only write the Payment
  // row after the order transition succeeds, so we never have a captured
  // payment record pointing at an order that is still in pending_payment.
  const paidOrder = await markOrderPaid(payload.orderId);

  const captured = await capturePayment({
    orderId: payload.orderId,
    amount: order.total ?? 0,
    providerOrderId: payload.razorpayOrderId,
    providerPaymentId: payload.razorpayPaymentId
  });

  // Fire-and-forget receipt — a failed email must never surface as a payment error
  if (paidOrder) {
    void (async () => {
      const customer = await userRepository.findById(order.customerId);
      const customerEmail = customer?.email ?? "";
      const customerName = customer?.name ?? "there";
      if (customerEmail) {
        await sendPaymentReceiptEmail(paidOrder, captured.payment, customerEmail, customerName);
      }
    })();
  }

  sendSuccess(res, { order: paidOrder, payment: captured.payment }, "Payment verified");
});
