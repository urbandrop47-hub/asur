import { AppError } from "../lib/errors";
import { couponRepository } from "../repositories/coupon.repository";
import { orderRepository } from "../repositories/order.repository";
import type { Coupon } from "../shared/types";

export type CouponValidationResult = {
  coupon: Coupon;
  discountAmount: number; // in INR
  freeShipping: boolean;
};

/** Validate a coupon code against a subtotal and (optionally) a customer's order history.
 *  Throws AppError with a user-facing message on any failure. */
export async function validateCoupon(
  code: string,
  subtotal: number,
  customerId?: string
): Promise<CouponValidationResult> {
  const upper = code.toUpperCase().trim();
  const coupon = await couponRepository.findByCode(upper);

  if (!coupon) throw new AppError(404, "Coupon code not found");
  if (!coupon.isActive) throw new AppError(422, "This coupon is no longer active");

  if (coupon.expiresAt && coupon.expiresAt.length > 0) {
    if (new Date(coupon.expiresAt) < new Date()) {
      throw new AppError(422, "This coupon has expired");
    }
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(422, "This coupon has reached its usage limit");
  }

  if (subtotal < coupon.minOrderValue) {
    throw new AppError(422, `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`);
  }

  // Per-customer limit check — count how many orders this customer placed with this code
  if (coupon.perCustomerLimit > 0 && customerId) {
    const customerOrders = await orderRepository.countByCustomerAndCoupon(customerId, upper);
    if (customerOrders >= coupon.perCustomerLimit) {
      throw new AppError(422, "You have already used this coupon");
    }
  }

  // Compute discount
  let discountAmount = 0;
  let freeShipping = false;

  if (coupon.type === "percent") {
    discountAmount = Math.round(subtotal * (coupon.value / 100));
  } else if (coupon.type === "fixed") {
    discountAmount = Math.min(coupon.value, subtotal); // can't discount more than subtotal
  } else if (coupon.type === "free_shipping") {
    freeShipping = true;
    discountAmount = 0; // shipping discount applied separately at order level
  }

  return { coupon, discountAmount, freeShipping };
}

/** Apply a coupon to an order — call AFTER the order is created.
 *  Atomically increments usedCount; returns false if the limit was hit concurrently. */
export async function applyCoupon(code: string, usageLimit: number): Promise<boolean> {
  return couponRepository.incrementUsedCount(code, usageLimit);
}
