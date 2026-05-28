import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { captureMockPayment, createRazorpayOrder, verifyPaymentSignature } from "../services/payment.service";
import { paymentCreateOrderSchema, paymentVerificationSchema } from "../validators/payment.validators";

export const createPaymentOrderController = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, amount } = paymentCreateOrderSchema.parse(req.body);
  const providerOrder = await createRazorpayOrder({ orderId, amount, currency: "INR" });
  sendSuccess(res, providerOrder, "Payment order created");
});

export const verifyPaymentController = asyncHandler(async (req: Request, res: Response) => {
  const payload = paymentVerificationSchema.parse(req.body);
  const isValid = verifyPaymentSignature(payload);

  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }

  const captured = await captureMockPayment(payload.orderId, 0);
  sendSuccess(res, captured, "Payment verified");
});
