import type { Coupon } from "../shared/types";
import { hasMongoConnection } from "../config/env";
import { CouponModel } from "../models/coupon.model";

const mockCoupons: Coupon[] = [];

export const couponRepository = {
  async findByCode(code: string): Promise<Coupon | null> {
    const upper = code.toUpperCase().trim();
    if (hasMongoConnection) {
      return CouponModel.findOne({ code: upper }).lean<Coupon>().exec();
    }
    return mockCoupons.find((c) => c.code === upper) ?? null;
  },

  async list(): Promise<Coupon[]> {
    if (hasMongoConnection) {
      return CouponModel.find({}).sort({ createdAt: -1 }).lean<Coupon[]>().exec();
    }
    return [...mockCoupons];
  },

  async create(input: Omit<Coupon, "usedCount" | "createdAt" | "updatedAt">): Promise<Coupon> {
    const now = new Date().toISOString();
    const coupon: Coupon = {
      ...input,
      code: input.code.toUpperCase().trim(),
      usedCount: 0,
      createdAt: now,
      updatedAt: now
    };
    if (hasMongoConnection) {
      const doc = await CouponModel.create(coupon);
      return doc.toObject() as Coupon;
    }
    mockCoupons.push(coupon);
    return coupon;
  },

  async update(code: string, updates: Partial<Pick<Coupon, "isActive" | "description" | "usageLimit" | "perCustomerLimit" | "expiresAt" | "value" | "minOrderValue">>): Promise<Coupon | null> {
    const upper = code.toUpperCase().trim();
    const now = new Date().toISOString();
    if (hasMongoConnection) {
      return CouponModel.findOneAndUpdate({ code: upper }, { ...updates, updatedAt: now }, { new: true }).lean<Coupon>().exec();
    }
    const c = mockCoupons.find((x) => x.code === upper);
    if (!c) return null;
    Object.assign(c, updates, { updatedAt: now });
    return c;
  },

  /** Atomically increment usedCount. Returns false if it would exceed usageLimit. */
  async incrementUsedCount(code: string, limit: number): Promise<boolean> {
    const upper = code.toUpperCase().trim();
    if (hasMongoConnection) {
      const filter = limit > 0
        ? { code: upper, $expr: { $lt: ["$usedCount", limit] } }
        : { code: upper };
      const result = await CouponModel.updateOne(filter, { $inc: { usedCount: 1 }, $set: { updatedAt: new Date().toISOString() } });
      return result.modifiedCount > 0;
    }
    const c = mockCoupons.find((x) => x.code === upper);
    if (!c) return false;
    if (limit > 0 && c.usedCount >= limit) return false;
    c.usedCount++;
    return true;
  },

  /** Decrement usedCount by 1 (floor 0) — called when an order with this coupon is cancelled. */
  async decrementUsedCount(code: string): Promise<void> {
    const upper = code.toUpperCase().trim();
    if (hasMongoConnection) {
      await CouponModel.updateOne(
        { code: upper, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 }, $set: { updatedAt: new Date().toISOString() } }
      );
      return;
    }
    const c = mockCoupons.find((x) => x.code === upper);
    if (c && c.usedCount > 0) c.usedCount--;
  },

  async delete(code: string): Promise<boolean> {
    const upper = code.toUpperCase().trim();
    if (hasMongoConnection) {
      const result = await CouponModel.deleteOne({ code: upper });
      return result.deletedCount > 0;
    }
    const idx = mockCoupons.findIndex((c) => c.code === upper);
    if (idx === -1) return false;
    mockCoupons.splice(idx, 1);
    return true;
  }
};
