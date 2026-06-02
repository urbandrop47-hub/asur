import type { CreateOrderInput } from "../shared/validations";
import { AppError } from "../lib/errors";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { userRepository } from "../repositories/user.repository";
import { sendAdminNewOrderEmail, sendOrderConfirmationEmail, sendLowStockAlertEmail } from "./email.service";
import { triggerBackInStockNotifications } from "./inventory.service";
import { validateCoupon, applyCoupon } from "./coupon.service";
import { couponRepository } from "../repositories/coupon.repository";

const LOW_STOCK_THRESHOLD = 5;

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

  // Validate coupon before creating the order (so we never create an order with a bad code)
  let couponResult: Awaited<ReturnType<typeof validateCoupon>> | null = null;
  if (input.couponCode) {
    couponResult = await validateCoupon(
      input.couponCode,
      verifiedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      input.customerId
    );
  }

  const order = await orderRepository.create({
    ...input,
    items: verifiedItems,
    paymentStatus: "pending",
    fulfillmentStatus: "unassigned",
    couponCode: couponResult ? couponResult.coupon.code : undefined,
    discountAmount: couponResult ? couponResult.discountAmount : 0,
    freeShipping: couponResult ? couponResult.freeShipping : false
  });

  // Atomically decrement stock for each variant. Because a concurrent order may have
  // taken the last unit between our validation check and now, we verify each decrement
  // succeeded. If any fail, we cancel the order and return a 409.
  const decrementResults = await Promise.all(
    verifiedItems.map(async (item) => {
      const ok = await productRepository.decrementVariantStock(item.productId, item.variantSku, item.quantity);
      return { ...item, ok };
    })
  );

  const failed = decrementResults.find((r) => !r.ok);
  if (failed) {
    // Roll back: cancel the order, restore already-decremented variants
    await orderRepository.updateStatus(order.id, "cancelled");
    await Promise.all(
      decrementResults
        .filter((r) => r.ok)
        .map((r) => productRepository.incrementVariantStock(r.productId, r.variantSku, r.quantity))
    );
    throw new AppError(409, `Item sold out — another order just took the last unit for SKU ${failed.variantSku}`);
  }

  // Fire-and-forget low-stock alerts for variants that dropped below the threshold
  void (async () => {
    for (const item of verifiedItems) {
      const product = await productRepository.findById(item.productId);
      const variant = product?.variants.find((v) => v.sku === item.variantSku);
      if (variant && variant.stock < LOW_STOCK_THRESHOLD && variant.stock >= 0) {
        await sendLowStockAlertEmail(product!.title, item.variantSku, variant.stock);
      }
    }
  })();

  // Atomically increment coupon usage count now that the order is confirmed
  if (couponResult) {
    const applied = await applyCoupon(couponResult.coupon.code, couponResult.coupon.usageLimit);
    if (!applied) {
      // Extremely rare race: usage limit hit between validation and now — cancel & release stock
      await orderRepository.updateStatus(order.id, "cancelled");
      await Promise.all(
        decrementResults.map((r) => productRepository.incrementVariantStock(r.productId, r.variantSku, r.quantity))
      );
      throw new AppError(409, "This coupon just reached its usage limit — please try without it");
    }
  }

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

/** Cancel an order and release the reserved stock back to each variant. */
export async function cancelOrder(orderId: string, requesterId: string, isAdmin = false) {
  const order = isAdmin
    ? await orderRepository.findByIdAdmin(orderId)
    : await orderRepository.findById(orderId, requesterId);

  if (!order) throw new AppError(404, "Order not found");
  if (!isAdmin && order.customerId !== requesterId) throw new AppError(403, "Access denied");

  const nonCancellableStatuses = ["shipped", "delivered", "cancelled"];
  if (nonCancellableStatuses.includes(order.status)) {
    throw new AppError(422, `Cannot cancel an order in status: ${order.status}`);
  }

  await orderRepository.updateStatus(orderId, "cancelled");

  // Release stock back to each variant
  await Promise.all(
    order.items.map((item) =>
      productRepository.incrementVariantStock(item.productId, item.variantSku, item.quantity)
    )
  );

  // Refund the coupon redemption so the code can be reused
  if (order.couponCode) {
    await couponRepository.decrementUsedCount(order.couponCode);
  }

  // Check for back-in-stock alerts on any variant that was restocked
  void (async () => {
    for (const item of order.items) {
      await triggerBackInStockNotifications(item.productId, item.variantSku);
    }
  })();

  return orderRepository.findByIdAdmin(orderId);
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
