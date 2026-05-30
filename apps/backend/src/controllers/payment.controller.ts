import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { captureMockPayment, createRazorpayOrder, verifyPaymentSignature } from "../services/payment.service";
import { paymentCreateOrderSchema, paymentVerificationSchema } from "../validators/payment.validators";

export const createPaymentOrderController: RequestHandler = asyncHandler(async (req, res) => {
  const { orderId, amount } = paymentCreateOrderSchema.parse(req.body);
  const providerOrder = await createRazorpayOrder({ orderId, amount, currency: "INR" });
  sendSuccess(res, providerOrder, "Payment order created");
});

export const verifyPaymentController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = paymentVerificationSchema.parse(req.body);
  const isValid = verifyPaymentSignature(payload);

  if (!isValid) {
    res.status(400).json({ success: false, message: "Invalid payment signature" });
    return;
  }

  const captured = await captureMockPayment(payload.orderId, 0);
  sendSuccess(res, captured, "Payment verified");
});
