import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { PaymentStatus } from "@asur/types";
import { env, hasRazorpayCredentials } from "../config/env";
import { orderRepository } from "../repositories/order.repository";

export async function createRazorpayOrder(input: { orderId: string; amount: number; currency: "INR" }) {
  if (!hasRazorpayCredentials) {
    return {
      providerOrderId: `rzp_${crypto.randomUUID()}`,
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
    payment_capture: 1
  });

  return order;
}

export function verifyPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  if (!hasRazorpayCredentials) {
    return true;
  }

  const digest = crypto
    .createHmac("sha256", env.RAZORPAY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  return digest === input.razorpaySignature;
}

export async function captureMockPayment(orderId: string, amount: number) {
  const payment = await orderRepository.createPayment({
    orderId,
    amount,
    currency: "INR"
  });

  return {
    payment,
    status: "captured" as PaymentStatus
  };
}
