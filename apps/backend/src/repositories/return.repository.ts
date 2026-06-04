import type { Return, ReturnStatus } from "../shared/types";
import { hasMongoConnection } from "../config/env";
import { ReturnModel } from "../models/return.model";

const mockReturns: Return[] = [];

export const returnRepository = {
  async create(data: Return): Promise<Return> {
    if (hasMongoConnection) {
      const doc = await ReturnModel.create(data);
      const { _id, __v, ...rest } = doc.toObject() as Record<string, unknown>;
      void _id; void __v;
      return rest as Return;
    }
    mockReturns.push(data);
    return data;
  },

  async findById(id: string): Promise<Return | null> {
    if (hasMongoConnection) return ReturnModel.findOne({ id }).lean<Return>().exec();
    return mockReturns.find((r) => r.id === id) ?? null;
  },

  async findByOrderAndCustomer(orderId: string, customerId: string): Promise<Return | null> {
    if (hasMongoConnection) return ReturnModel.findOne({ orderId, customerId }).lean<Return>().exec();
    return mockReturns.find((r) => r.orderId === orderId && r.customerId === customerId) ?? null;
  },

  async findByCustomer(customerId: string): Promise<Return[]> {
    if (hasMongoConnection) return ReturnModel.find({ customerId }).sort({ createdAt: -1 }).lean<Return[]>().exec();
    return mockReturns.filter((r) => r.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findAll(filter?: { status?: ReturnStatus }): Promise<Return[]> {
    if (hasMongoConnection) {
      const query = filter?.status ? { status: filter.status } : {};
      return ReturnModel.find(query).sort({ createdAt: -1 }).lean<Return[]>().exec();
    }
    const list = filter?.status ? mockReturns.filter((r) => r.status === filter.status) : mockReturns;
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateStatus(id: string, status: ReturnStatus, extra?: { refundId?: string; refundAmount?: number; adminNote?: string }): Promise<Return | null> {
    const now = new Date().toISOString();
    if (hasMongoConnection) {
      return ReturnModel.findOneAndUpdate(
        { id },
        { $set: { status, updatedAt: now, ...extra } },
        { new: true }
      ).lean<Return>().exec();
    }
    const r = mockReturns.find((r) => r.id === id);
    if (!r) return null;
    r.status = status;
    r.updatedAt = now;
    if (extra?.refundId) r.refundId = extra.refundId;
    if (extra?.refundAmount !== undefined) r.refundAmount = extra.refundAmount;
    if (extra?.adminNote) r.adminNote = extra.adminNote;
    return r;
  }
};
