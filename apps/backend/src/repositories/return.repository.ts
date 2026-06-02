import type { Return, ReturnStatus } from "../shared/types";
import { ReturnModel } from "../models/return.model";

export const returnRepository = {
  async create(data: Return): Promise<Return> {
    await ReturnModel.create(data);
    return data;
  },

  async findById(id: string): Promise<Return | null> {
    return ReturnModel.findOne({ id }).lean<Return>().exec();
  },

  async findByOrderAndCustomer(orderId: string, customerId: string): Promise<Return | null> {
    return ReturnModel.findOne({ orderId, customerId }).lean<Return>().exec();
  },

  async findByCustomer(customerId: string): Promise<Return[]> {
    return ReturnModel.find({ customerId }).sort({ createdAt: -1 }).lean<Return[]>().exec();
  },

  async findAll(filter?: { status?: ReturnStatus }): Promise<Return[]> {
    const query = filter?.status ? { status: filter.status } : {};
    return ReturnModel.find(query).sort({ createdAt: -1 }).lean<Return[]>().exec();
  },

  async updateStatus(id: string, status: ReturnStatus, extra?: { refundId?: string; refundAmount?: number; adminNote?: string }): Promise<Return | null> {
    const now = new Date().toISOString();
    return ReturnModel.findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: now, ...extra } },
      { new: true }
    ).lean<Return>().exec();
  }
};
