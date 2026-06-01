import { hasMongoConnection } from "../config/env";
import { WishlistModel } from "../models/wishlist.model";

type WishlistEntry = {
  customerId: string;
  productId: string;
  addedAt: string;
};

const mockStore: WishlistEntry[] = [];

export const wishlistRepository = {
  async listForCustomer(customerId: string): Promise<WishlistEntry[]> {
    if (hasMongoConnection) {
      return WishlistModel.find({ customerId }).sort({ addedAt: -1 }).lean<WishlistEntry[]>().exec();
    }
    return mockStore.filter((e) => e.customerId === customerId);
  },

  async add(customerId: string, productId: string): Promise<WishlistEntry> {
    const addedAt = new Date().toISOString();
    if (hasMongoConnection) {
      const doc = await WishlistModel.findOneAndUpdate(
        { customerId, productId },
        { $setOnInsert: { customerId, productId, addedAt } },
        { upsert: true, new: true }
      ).lean<WishlistEntry>().exec();
      return doc!;
    }
    const existing = mockStore.find((e) => e.customerId === customerId && e.productId === productId);
    if (existing) return existing;
    const entry: WishlistEntry = { customerId, productId, addedAt };
    mockStore.push(entry);
    return entry;
  },

  async remove(customerId: string, productId: string): Promise<boolean> {
    if (hasMongoConnection) {
      const result = await WishlistModel.deleteOne({ customerId, productId });
      return result.deletedCount > 0;
    }
    const idx = mockStore.findIndex((e) => e.customerId === customerId && e.productId === productId);
    if (idx === -1) return false;
    mockStore.splice(idx, 1);
    return true;
  },

  async isWishlisted(customerId: string, productId: string): Promise<boolean> {
    if (hasMongoConnection) {
      const count = await WishlistModel.countDocuments({ customerId, productId });
      return count > 0;
    }
    return mockStore.some((e) => e.customerId === customerId && e.productId === productId);
  }
};
