import type { CreateOrderInput } from "../shared/validations";
import { AppError } from "../lib/errors";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { userRepository } from "../repositories/user.repository";
import { sendAdminNewOrderEmail, sendOrderConfirmationEmail } from "./email.service";

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
      return { ...item, unitPrice: variant.price, productTitle: product.title };
    })
  );

  const order = await orderRepository.create({
    ...input,
    items: verifiedItems,
    paymentStatus: "pending",
    fulfillmentStatus: "unassigned"
  });

  // Decrement stock for each variant after the order is persisted.
  // This is best-effort: a failure here does not roll back the order,
  // but the stock check above prevents over-commitment at read time.
  await Promise.all(
    verifiedItems.map((item) =>
      productRepository.decrementVariantStock(item.productId, item.variantSku, item.quantity)
    )
  );

  const vendorTask = await orderRepository.createVendorTask(order.id);

  // Fire-and-forget — email failures must never break the order flow
  void (async () => {
    const customer = await userRepository.findById(input.customerId);
    const customerEmail = customer?.email ?? "";
    const customerName = customer?.name ?? "there";
    if (customerEmail) {
      await sendOrderConfirmationEmail(order, customerEmail, customerName);
    }
    await sendAdminNewOrderEmail(order, customerEmail || "unknown");
  })();

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

  // Idempotent only when both fields are fully settled so that a partial failure
  // (status updated but paymentStatus not yet) is retried rather than silently skipped.
  if (existing.status === "paid" && existing.paymentStatus === "captured") {
    return existing;
  }

  await orderRepository.updateStatus(orderId, "paid");
  const order = await orderRepository.updatePaymentStatus(orderId, "captured");
  await orderRepository.ensureVendorTask(orderId);
  return order;
}
