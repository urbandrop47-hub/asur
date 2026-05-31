import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { PaymentStatus } from "@asur/types";
import { env, hasRazorpayCredentials } from "../config/env";
import { orderRepository } from "../repositories/order.repository";

export async function createRazorpayOrder(input: { orderId: string; amount: number; currency: "INR" }) {
  if (!hasRazorpayCredentials) {
    const providerOrderId = `rzp_mock_${crypto.randomUUID()}`;
    await orderRepository.updateProviderOrderId(input.orderId, providerOrderId);
    return {
      providerOrderId,
      amount: input.amount,
      currency: input.currency,
      status: "mock"
    };
  }

  const client = new Razorpay({
    key_id: env.RAZORPAY_KEY,
    key_secret: env.RAZORPAY_SECRET
  });

  const order = await client.orders.create({
    amount: input.amount * 100,
    currency: input.currency,
    receipt: input.orderId,
    payment_capture: true
  });

  // Store the Razorpay order ID on the ASUR order so verification can reference it
  const providerOrderId = (order as { id?: string }).id ?? "";
  if (providerOrderId) {
    await orderRepository.updateProviderOrderId(input.orderId, providerOrderId);
  }

  return order;
}

export function verifyPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  if (!hasRazorpayCredentials) {
    // In production, missing Razorpay credentials must be a hard failure — never auto-accept.
    if (env.NODE_ENV === "production") {
      throw new Error("Razorpay credentials are not configured. Cannot verify payment signature.");
    }
    // Dev/test mock: the mock checkout sends a fixed sentinel; accept only that.
    return input.razorpaySignature === "mock_signature" && input.razorpayOrderId.startsWith("rzp_mock_");
  }

  const digest = crypto
    .createHmac("sha256", env.RAZORPAY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(input.razorpaySignature));
}

export async function capturePayment(input: {
  orderId: string;
  amount: number;
  providerOrderId?: string;
  providerPaymentId?: string;
}) {
  const payment = await orderRepository.createPayment({
    orderId: input.orderId,
    amount: input.amount,
    currency: "INR",
    providerOrderId: input.providerOrderId,
    providerPaymentId: input.providerPaymentId,
    status: "captured"
  });

  return {
    payment,
    status: "captured" as PaymentStatus
  };
}
