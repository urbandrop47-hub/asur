import type { CreateOrderInput } from "@asur/validations";
import { AppError } from "../lib/errors";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";

export async function createOrder(input: CreateOrderInput) {
  // Validate each item against the real product catalogue and override the
  // client-supplied unitPrice with the canonical price from the database.
  // This prevents a buyer from submitting a tampered price.
  const verifiedItems = await Promise.all(
    input.items.map(async (item) => {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new AppError(422, `Product not found`, { productId: item.productId });
      }
      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant) {
        throw new AppError(422, `Selected variant is no longer available`, { variantSku: item.variantSku });
      }
      if (variant.stock < item.quantity) {
        throw new AppError(409, `Only ${variant.stock} unit(s) left for this item`, { variantSku: item.variantSku, available: variant.stock });
      }
      return { ...item, unitPrice: variant.price };
    })
  );

  const order = await orderRepository.create({
    ...input,
    items: verifiedItems,
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
  const existing = await orderRepository.findByIdAdmin(orderId);
  if (!existing) throw new AppError(404, "Order not found");

  // Idempotent: if already paid, return without touching anything
  if (existing.status === "paid" || existing.paymentStatus === "captured") {
    return existing;
  }

  const order = await orderRepository.updateStatus(orderId, "paid");
  await orderRepository.updatePaymentStatus(orderId, "captured");
  await orderRepository.ensureVendorTask(orderId);
  return order;
}
