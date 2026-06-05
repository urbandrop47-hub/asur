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
import { loyaltyRepository, EARN_RATE } from "../repositories/loyalty.repository";
import { referralRepository } from "../repositories/referral.repository";
import { notificationRepository } from "../repositories/notification.repository";

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

  // Guard: cancelled orders cannot be paid
  if (existingOrder.status === "cancelled") {
    res.status(422).json({ success: false, message: "This order has been cancelled and cannot be paid" });
    return;
  }

  // Always derive the Razorpay amount from the server-computed order total — never
  // trust the client-supplied amount, which could be tampered to pay ₹0.01.
  const amountPaise = Math.round((existingOrder.total ?? 0) * 100);

  // When a gift card or loyalty discount covers the full order, the total is ₹0.
  // Razorpay doesn't accept zero-amount orders, so we complete the order directly.
  if (amountPaise === 0) {
    // Idempotency: if already fully settled, return early without re-firing side effects.
    if (existingOrder.status === "paid" && existingOrder.paymentStatus === "captured") {
      sendSuccess(res, { providerOrderId: null, amount: 0, currency: "INR", zeroCost: true, order: existingOrder }, "Order already completed");
      return;
    }

    const paidOrder = await markOrderPaid(orderId);

    // Fire post-payment side effects.
    // NOTE: sendOrderConfirmationEmail is NOT sent here — createOrder() already sent it.
    // We only send the receipt/loyalty/referral effects that normally fire in verifyPaymentController.
    if (paidOrder) {
      void (async () => {
        // Zero-amount orders earn 0 loyalty points (nothing paid), but referral bonus still applies.
        const orderReferralCode = (paidOrder as typeof paidOrder & { referralCode?: string }).referralCode;
        if (orderReferralCode) {
          const referral = await referralRepository.findByCode(orderReferralCode);
          if (referral && referral.userId !== existingOrder.customerId) {
            const wasNew = await referralRepository.markUsed(orderReferralCode, existingOrder.customerId);
            if (wasNew) {
              await loyaltyRepository.earnPoints(referral.userId, 100, `Referral bonus — ${orderReferralCode}`, paidOrder.id, "referral_bonus");
              await loyaltyRepository.earnPoints(existingOrder.customerId, 50, "Referral signup bonus", paidOrder.id, "referral_bonus");
            }
          }
        }
      })();
    }

    sendSuccess(res, { providerOrderId: null, amount: 0, currency: "INR", zeroCost: true, order: paidOrder }, "Order completed — no payment required");
    return;
  }

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

  // Reject verification on terminal statuses — prevents a Razorpay payment from
  // silently resurrecting a cancelled or already-paid order.
  if (order.status === "cancelled") {
    res.status(422).json({ success: false, message: "This order has been cancelled and cannot be paid" });
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

  // Fire-and-forget: receipt email + loyalty points earn
  if (paidOrder) {
    void (async () => {
      const customer = await userRepository.findById(order.customerId);
      const customerEmail = customer?.email ?? "";
      const customerName = customer?.name ?? "there";
      if (customerEmail) {
        await sendPaymentReceiptEmail(paidOrder, captured.payment, customerEmail, customerName);
      }

      // Earn 1pt per ₹10 spent (on the amount actually paid after all discounts)
      const paidAmount = paidOrder.total ?? 0;
      const pointsEarned = Math.floor(paidAmount / EARN_RATE);
      if (pointsEarned > 0) {
        await loyaltyRepository.earnPoints(
          order.customerId,
          pointsEarned,
          `Earned for order #${paidOrder.orderNumber}`,
          paidOrder.id
        );
        await notificationRepository.create({
          userId: order.customerId,
          type: "loyalty",
          title: `You earned ${pointsEarned} points!`,
          body: `${pointsEarned} loyalty points credited for order #${paidOrder.orderNumber}.`,
          link: "/account/loyalty"
        });
      }

      // Credit referral bonus now that payment is confirmed — avoids farming via create+cancel
      const orderReferralCode = (paidOrder as typeof paidOrder & { referralCode?: string }).referralCode;
      if (orderReferralCode) {
        const referral = await referralRepository.findByCode(orderReferralCode);
        if (referral && referral.userId !== order.customerId) {
          const wasNew = await referralRepository.markUsed(orderReferralCode, order.customerId);
          if (wasNew) {
            await loyaltyRepository.earnPoints(referral.userId, 100, `Referral bonus — ${orderReferralCode}`, paidOrder.id, "referral_bonus");
            await loyaltyRepository.earnPoints(order.customerId, 50, "Referral signup bonus", paidOrder.id, "referral_bonus");
          }
        }
      }
    })();
  }

  sendSuccess(res, { order: paidOrder, payment: captured.payment }, "Payment verified");
});
