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

export async function listOrders() {
  return orderRepository.list();
}
