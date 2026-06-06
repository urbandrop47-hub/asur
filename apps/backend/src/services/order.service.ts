import type { CreateOrderInput } from "../shared/validations";
import { AppError } from "../lib/errors";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { userRepository } from "../repositories/user.repository";
import { sendAdminNewOrderEmail, sendOrderConfirmationEmail, sendLowStockAlertEmail } from "./email.service";
import { triggerBackInStockNotifications } from "./inventory.service";
import { validateCoupon, applyCoupon } from "./coupon.service";
import { couponRepository } from "../repositories/coupon.repository";
import { loyaltyRepository, REDEEM_RATE, MIN_REDEEM, MAX_REDEEM_PCT } from "../repositories/loyalty.repository";
import { validateGiftCard, applyGiftCard, restoreGiftCard } from "./gift-card.service";
import { getOrderPricingConfig } from "../models/site-config.model";

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
      // Skip stock check for pre-order products — they accept orders regardless of current stock
      if (product.status !== "preorder" && variant.stock < item.quantity) {
        throw new AppError(409, `Only ${variant.stock} unit(s) left for this item`, { variantSku: item.variantSku, available: variant.stock });
      }
      // Carry the full product/variant data so later steps don't need to re-fetch
      return { ...item, unitPrice: variant.price, productTitle: product.title, _product: product, _variant: variant };
    })
  );

  const subtotal = verifiedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const isGuest = !input.customerId && !!input.guestPhone;

  // Validate coupon before creating the order (so we never create an order with a bad code).
  // For guest orders pass undefined customerId — tier-gated coupons will be skipped.
  let couponResult: Awaited<ReturnType<typeof validateCoupon>> | null = null;
  if (input.couponCode) {
    couponResult = await validateCoupon(input.couponCode, subtotal, input.customerId);
  }

  // Loyalty + gift-card redemption is only available to authenticated customers
  const pointsToRedeem = isGuest ? 0 : (input.loyaltyPointsToRedeem ?? 0);
  let actualPointsRedeemed = 0;
  let loyaltyDiscount = 0;
  if (!isGuest && pointsToRedeem >= MIN_REDEEM && input.customerId) {
    const account = await loyaltyRepository.getAccount(input.customerId);
    const available = account?.points ?? 0;
    const capped = Math.min(pointsToRedeem, available);
    const maxDiscount = Math.floor(subtotal * MAX_REDEEM_PCT);
    const desiredDiscount = Math.floor(capped / REDEEM_RATE);
    const finalDiscount = Math.min(desiredDiscount, maxDiscount);
    actualPointsRedeemed = finalDiscount * REDEEM_RATE;
    loyaltyDiscount = finalDiscount;
  }

  // Gift card only available to authenticated customers
  let giftCardResult: Awaited<ReturnType<typeof validateGiftCard>> | null = null;
  if (!isGuest && input.giftCardCode) {
    // Compute estimated order total for capping (coupon + loyalty already factored)
    const { freeShippingThreshold, shippingFee, gstRate } = await getOrderPricingConfig();
    const couponDiscount = couponResult ? couponResult.discountAmount : 0;
    const taxable = Math.max(0, subtotal - couponDiscount);
    const baseShip = subtotal >= freeShippingThreshold ? 0 : shippingFee;
    const ship = couponResult?.freeShipping ? 0 : baseShip;
    const estimatedTotal = Math.max(0, taxable + ship + Math.round(taxable * gstRate) - loyaltyDiscount);
    giftCardResult = await validateGiftCard(input.giftCardCode, estimatedTotal);
  }

  // Strip internal cache fields before passing to repository
  const orderItems = verifiedItems.map(({ _product: _p, _variant: _v, ...rest }) => { void _p; void _v; return rest; });

  const order = await orderRepository.create({
    ...input,
    items: orderItems,
    paymentStatus: "pending",
    fulfillmentStatus: "unassigned",
    couponCode: couponResult ? couponResult.coupon.code : undefined,
    discountAmount: couponResult ? couponResult.discountAmount : 0,
    freeShipping: couponResult ? couponResult.freeShipping : false,
    loyaltyPointsRedeemed: actualPointsRedeemed,
    loyaltyDiscount,
    giftCardCode: giftCardResult ? giftCardResult.card.code : undefined,
    giftCardAmount: giftCardResult ? giftCardResult.applicableAmount : 0
  });

  // Atomically decrement stock for each variant. Pre-order products skip this step
  // (they accept orders regardless of stock level; inventory is managed separately).
  const decrementResults = await Promise.all(
    verifiedItems.map(async (item) => {
      if (item._product.status === "preorder") return { ...item, ok: true, skipped: true };
      const ok = await productRepository.decrementVariantStock(item.productId, item.variantSku, item.quantity);
      return { ...item, ok, skipped: false };
    })
  );

  const failed = decrementResults.find((r) => !r.ok);
  if (failed) {
    // Roll back: cancel the order, restore already-decremented variants
    await orderRepository.updateStatus(order.id, "cancelled");
    await Promise.all(
      decrementResults
        .filter((r) => r.ok && !r.skipped)
        .map((r) => productRepository.incrementVariantStock(r.productId, r.variantSku, r.quantity))
    );
    throw new AppError(409, `Item sold out — another order just took the last unit for SKU ${failed.variantSku}`);
  }

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

  // Deduct gift card balance atomically — restored if order is cancelled
  if (giftCardResult) {
    const gcApplied = await applyGiftCard(giftCardResult.card.code, giftCardResult.applicableAmount);
    if (!gcApplied) {
      await orderRepository.updateStatus(order.id, "cancelled");
      await Promise.all(
        decrementResults.map((r) => productRepository.incrementVariantStock(r.productId, r.variantSku, r.quantity))
      );
      if (couponResult) {
        await couponRepository.decrementUsedCount(couponResult.coupon.code);
      }
      throw new AppError(409, "Gift card balance was just used by another order — please try without it");
    }
  }

  // Deduct loyalty points optimistically — restored if order is cancelled before payment
  if (actualPointsRedeemed > 0 && input.customerId) {
    const redeemed = await loyaltyRepository.redeemPoints(
      input.customerId,
      actualPointsRedeemed,
      `Redeemed for order #${order.orderNumber}`,
      order.id
    );
    if (!redeemed.success) {
      // Concurrent depletion — cancel order, release stock, undo coupon + gift card
      await orderRepository.updateStatus(order.id, "cancelled");
      await Promise.all(
        decrementResults.map((r) => productRepository.incrementVariantStock(r.productId, r.variantSku, r.quantity))
      );
      if (couponResult) {
        await couponRepository.decrementUsedCount(couponResult.coupon.code);
      }
      if (giftCardResult) {
        await restoreGiftCard(giftCardResult.card.code, giftCardResult.applicableAmount);
      }
      throw new AppError(409, "Insufficient loyalty points — another redemption was processed simultaneously");
    }
  }

  // Fire-and-forget low-stock alerts only after all reversible checkout checks
  // have succeeded. Re-fetch the actual DB stock rather than estimating from the
  // in-memory snapshot (which is stale if concurrent orders ran between validation
  // and decrement). Skip pre-order products — their stock is managed separately.
  void (async () => {
    for (const item of verifiedItems) {
      if (item._product.status === "preorder") continue;
      const fresh = await productRepository.findById(item.productId);
      const freshVariant = fresh?.variants.find((v) => v.sku === item.variantSku);
      const currentStock = freshVariant?.stock ?? 0;
      if (currentStock < LOW_STOCK_THRESHOLD && currentStock >= 0) {
        await sendLowStockAlertEmail(item._product.title, item.variantSku, currentStock);
      }
    }
  })();

  const vendorTask = await orderRepository.createVendorTask(order.id);

  // Fire-and-forget — email failures must never break the order flow
  void (async () => {
    let customerEmail = "";
    let customerName = "there";
    if (input.customerId) {
      const customer = await userRepository.findById(input.customerId);
      customerEmail = customer?.email ?? "";
      customerName = customer?.name ?? "there";
    }
    // Guest orders: no confirmation email (no email address collected at checkout)
    if (customerEmail) {
      await sendOrderConfirmationEmail(order, customerEmail, customerName);
    }
    await sendAdminNewOrderEmail(order, customerEmail || `guest:${input.guestPhone ?? "unknown"}`);
  })();

  return { order, vendorTask };
}

export async function listOrdersByCustomer(customerId: string) {
  return orderRepository.listByCustomer(customerId);
}

export async function getOrderById(id: string, customerId: string) {
  return orderRepository.findById(id, customerId);
}

export async function getOrderByIdForGuest(id: string, guestPhone: string) {
  return orderRepository.findByIdForGuest(id, guestPhone);
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

  // Atomically transition to cancelled only if still in a cancellable status —
  // prevents a race where the order moves to "shipped" between our check and this write.
  const cancelled = await orderRepository.updateStatusConditional(
    orderId,
    "cancelled",
    nonCancellableStatuses
  );
  if (!cancelled) {
    throw new AppError(409, "Order status changed concurrently — please refresh and try again");
  }

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

  // Restore redeemed loyalty points
  const orderWithExtras = order as typeof order & { loyaltyPointsRedeemed?: number; giftCardCode?: string; giftCardAmount?: number };
  if (order.customerId && orderWithExtras.loyaltyPointsRedeemed && orderWithExtras.loyaltyPointsRedeemed > 0) {
    await loyaltyRepository.restorePoints(
      order.customerId,
      orderWithExtras.loyaltyPointsRedeemed,
      `Refund — cancelled order #${order.orderNumber}`,
      orderId
    );
  }

  // Restore gift card balance
  if (orderWithExtras.giftCardCode && orderWithExtras.giftCardAmount && orderWithExtras.giftCardAmount > 0) {
    await restoreGiftCard(orderWithExtras.giftCardCode, orderWithExtras.giftCardAmount);
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
