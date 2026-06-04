import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { Return, ReturnItem } from "../shared/types";
import type { UserProfile, Payment } from "@asur/types";
import { env, hasRazorpayCredentials } from "../config/env";
import { createId } from "../lib/id";
import { orderRepository } from "../repositories/order.repository";
import { returnRepository } from "../repositories/return.repository";
import { PaymentModel } from "../models/payment.model";
import { sendReturnConfirmationEmail, sendRefundInitiatedEmail } from "./email.service";
import { UserModel } from "../models/user.model";

const RETURN_WINDOW_DAYS = 7;

export async function requestReturn(
  orderId: string,
  customerId: string,
  input: { items: ReturnItem[]; reason: string }
): Promise<Return> {
  const order = await orderRepository.findById(orderId, customerId);
  if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
  if (order.status !== "delivered") throw Object.assign(new Error("Only delivered orders can be returned"), { status: 400 });

  // Use deliveredAt if set; fall back to updatedAt only when the field is absent
  const deliveryTimestamp = (order as Record<string, unknown>).deliveredAt as string | undefined;
  const deliveredAt = new Date(deliveryTimestamp ?? order.updatedAt);
  const cutoff = new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (new Date() > cutoff) throw Object.assign(new Error("Return window of 7 days has passed"), { status: 400 });

  const existing = await returnRepository.findByOrderAndCustomer(orderId, customerId);
  if (existing) throw Object.assign(new Error("A return request already exists for this order"), { status: 409 });

  // Validate requested items exist on the order
  for (const ri of input.items) {
    const orderItem = order.items.find((i) => i.variantSku === ri.variantSku);
    if (!orderItem) throw Object.assign(new Error(`Item ${ri.variantSku} not found in order`), { status: 400 });
    if (ri.quantity > orderItem.quantity) throw Object.assign(new Error(`Return quantity exceeds ordered quantity for ${ri.variantSku}`), { status: 400 });
  }

  const now = new Date().toISOString();
  const returnDoc: Return = {
    id: createId("ret"),
    orderId,
    orderNumber: order.orderNumber,
    customerId,
    items: input.items,
    reason: input.reason,
    status: "requested",
    createdAt: now,
    updatedAt: now
  };

  const saved = await returnRepository.create(returnDoc);

  // Fire-and-forget confirmation email
  void (async () => {
    try {
      const user = await UserModel.findOne({ id: customerId }).lean<UserProfile>().exec();
      if (user?.email) {
        await sendReturnConfirmationEmail(saved, order, user.email, user.name ?? "Customer");
      }
    } catch { /* non-critical */ }
  })();

  return saved;
}

export async function listReturns(filter?: { status?: Return["status"] }): Promise<Return[]> {
  return returnRepository.findAll(filter);
}

export async function getReturnByIdAdmin(id: string): Promise<Return | null> {
  return returnRepository.findById(id);
}

export async function listReturnsByCustomer(customerId: string): Promise<Return[]> {
  return returnRepository.findByCustomer(customerId);
}

export async function approveReturn(id: string, adminNote?: string): Promise<Return> {
  const ret = await returnRepository.findById(id);
  if (!ret) throw Object.assign(new Error("Return not found"), { status: 404 });
  if (ret.status !== "requested") throw Object.assign(new Error("Return is not in requested state"), { status: 400 });

  // Calculate refund amount from return items vs order
  const order = await orderRepository.findByIdAdmin(ret.orderId);
  if (!order) throw Object.assign(new Error("Original order not found"), { status: 500 });

  let refundAmount = 0;
  for (const ri of ret.items) {
    const orderItem = order.items.find((i) => i.variantSku === ri.variantSku);
    if (orderItem) refundAmount += orderItem.unitPrice * ri.quantity;
  }
  // Apply proportional discount: if a coupon reduced the order subtotal, each
  // item's effective price is reduced by the same ratio before adding GST.
  // Using order.discount / order.subtotal rather than deriving a rate from
  // order.tax prevents over-refunding on discounted orders.
  const discountRatio = order.subtotal > 0 ? Math.min(1, (order.discount ?? 0) / order.subtotal) : 0;
  refundAmount = Math.round(refundAmount * (1 - discountRatio) * 1.18);

  // Trigger Razorpay refund — only available in MongoDB mode (PaymentModel is MongoDB-only)
  let refundId: string | undefined;
  if (hasRazorpayCredentials || process.env.NODE_ENV !== "production") {
    try {
      const payment = await PaymentModel.findOne({ orderId: ret.orderId, status: "captured" }).lean<Payment>().exec();
      if (payment?.providerPaymentId) {
        refundId = await createRazorpayRefund(payment.providerPaymentId, refundAmount);
      }
    } catch (err) {
      // Razorpay refund failed — mark as approved without refundId so admin can retry
      const updated = await returnRepository.updateStatus(id, "approved", { refundAmount, adminNote });
      if (!updated) throw new Error("Failed to update return");
      throw Object.assign(
        new Error(`Return approved but Razorpay refund failed: ${err instanceof Error ? err.message : "unknown error"}`),
        { status: 502, return: updated }
      );
    }
  }

  const updated = await returnRepository.updateStatus(id, refundId ? "refunded" : "approved", {
    refundId,
    refundAmount,
    adminNote
  });

  if (!updated) throw new Error("Failed to update return");

  // Fire-and-forget email
  void (async () => {
    try {
      const user = await UserModel.findOne({ id: ret.customerId }).lean<UserProfile>().exec();
      if (user?.email) {
        await sendRefundInitiatedEmail(updated, user.email, user.name ?? "Customer");
      }
    } catch { /* non-critical */ }
  })();

  return updated;
}

export async function rejectReturn(id: string, adminNote?: string): Promise<Return> {
  const ret = await returnRepository.findById(id);
  if (!ret) throw Object.assign(new Error("Return not found"), { status: 404 });
  if (ret.status !== "requested") throw Object.assign(new Error("Return is not in requested state"), { status: 400 });

  const updated = await returnRepository.updateStatus(id, "rejected", { adminNote });
  if (!updated) throw new Error("Failed to update return");
  return updated;
}

async function createRazorpayRefund(providerPaymentId: string, amountInRupees: number): Promise<string> {
  if (!hasRazorpayCredentials) {
    // Mock mode
    return `rfnd_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
  }

  const client = new Razorpay({ key_id: env.RAZORPAY_KEY, key_secret: env.RAZORPAY_SECRET });
  const refund = await (client.payments as unknown as {
    refund: (id: string, opts: { amount: number }) => Promise<{ id: string }>;
  }).refund(providerPaymentId, { amount: amountInRupees * 100 });

  return refund.id;
}
