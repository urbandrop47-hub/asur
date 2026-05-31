import type { CreateOrderInput } from "@asur/validations";
import { orderRepository } from "../repositories/order.repository";

export async function createOrder(input: CreateOrderInput) {
  const order = await orderRepository.create({
    ...input,
    paymentStatus: "pending",
    fulfillmentStatus: "unassigned"
  });

  const vendorTask = await orderRepository.createVendorTask(order.id);
  return { order, vendorTask };
}

export async function listOrdersByCustomer(customerId: string) {
  return orderRepository.listByCustomer(customerId);
}

export async function getOrderById(id: string, customerId: string) {
  return orderRepository.findById(id, customerId);
}

export async function markOrderPaid(orderId: string) {
  await orderRepository.updateStatus(orderId, "paid");
  await orderRepository.updatePaymentStatus(orderId, "captured");
  await orderRepository.ensureVendorTask(orderId);
}
