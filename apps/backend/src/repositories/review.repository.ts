import type { Review } from "../shared/types";
import { hasMongoConnection } from "../config/env";
import { ReviewModel } from "../models/review.model";
import { createId } from "../lib/id";

export type CreateReviewInput = {
  orderId: string;
  customerId: string;
  productId: string;
  rating: number;
  body: string;
  images?: string[];
};

export type ReviewAggregate = {
  averageRating: number;
  count: number;
};

// Mock store for dev without MongoDB
const mockReviews: Review[] = [];

export const reviewRepository = {
  async create(input: CreateReviewInput): Promise<Review> {
    const now = new Date().toISOString();
    const review: Review = {
      id: createId("rev"),
      orderId: input.orderId,
      customerId: input.customerId,
      productId: input.productId,
      rating: input.rating,
      body: input.body,
      approved: false,
      verifiedPurchase: true,
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      helpfulVoters: [],
      images: input.images ?? [],
      createdAt: now
    };

    if (hasMongoConnection) {
      const doc = await ReviewModel.create(review);
      return doc.toObject() as Review;
    }
    mockReviews.push(review);
    return review;
  },

  async findByCustomerAndProduct(customerId: string, productId: string): Promise<Review | null> {
    if (hasMongoConnection) {
      return ReviewModel.findOne({ customerId, productId }).lean<Review>().exec();
    }
    return mockReviews.find((r) => r.customerId === customerId && r.productId === productId) ?? null;
  },

  async listForProduct(productId: string, page = 1, pageSize = 10): Promise<{ reviews: Review[]; aggregate: ReviewAggregate }> {
    if (hasMongoConnection) {
      const skip = (page - 1) * pageSize;
      const [reviews, agg] = await Promise.all([
        ReviewModel.find({ productId, approved: true })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean<Review[]>()
          .exec(),
        ReviewModel.aggregate([
          { $match: { productId, approved: true } },
          { $group: { _id: null, averageRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]).exec()
      ]);
      const aggregate: ReviewAggregate = agg[0]
        ? { averageRating: Math.round(agg[0].averageRating * 10) / 10, count: agg[0].count }
        : { averageRating: 0, count: 0 };
      return { reviews, aggregate };
    }

    const approved = mockReviews.filter((r) => r.productId === productId && r.approved);
    const avg = approved.length
      ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / approved.length) * 10) / 10
      : 0;
    const start = (page - 1) * pageSize;
    return { reviews: approved.slice(start, start + pageSize), aggregate: { averageRating: avg, count: approved.length } };
  },

  async listAll(page = 1, pageSize = 20, approvedOnly?: boolean): Promise<{ reviews: Review[]; total: number }> {
    if (hasMongoConnection) {
      const filter = approvedOnly !== undefined ? { approved: approvedOnly } : {};
      const [reviews, total] = await Promise.all([
        ReviewModel.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean<Review[]>()
          .exec(),
        ReviewModel.countDocuments(filter)
      ]);
      return { reviews, total };
    }
    const filtered = approvedOnly !== undefined ? mockReviews.filter((r) => r.approved === approvedOnly) : mockReviews;
    return { reviews: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length };
  },

  async approve(id: string): Promise<Review | null> {
    if (hasMongoConnection) {
      return ReviewModel.findOneAndUpdate({ id }, { approved: true }, { new: true }).lean<Review>().exec();
    }
    const r = mockReviews.find((r) => r.id === id);
    if (r) r.approved = true;
    return r ?? null;
  },

  async deleteById(id: string): Promise<boolean> {
    if (hasMongoConnection) {
      const result = await ReviewModel.deleteOne({ id });
      return result.deletedCount > 0;
    }
    const idx = mockReviews.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    mockReviews.splice(idx, 1);
    return true;
  },

  async findByCustomer(customerId: string): Promise<Review[]> {
    if (hasMongoConnection) {
      return ReviewModel.find({ customerId }).sort({ createdAt: -1 }).lean<Review[]>().exec();
    }
    return mockReviews.filter((r) => r.customerId === customerId);
  },

  async voteHelpful(id: string, customerId: string, vote: "up" | "down"): Promise<Review | null> {
    if (hasMongoConnection) {
      const existing = await ReviewModel.findOne({ id }).lean<Review>().exec();
      if (!existing) return null;
      // Idempotent: ignore if already voted
      if (existing.helpfulVoters.includes(customerId)) return existing;
      const inc = vote === "up" ? { helpfulVotes: 1 } : { unhelpfulVotes: 1 };
      return ReviewModel.findOneAndUpdate(
        { id },
        { $inc: inc, $push: { helpfulVoters: customerId } },
        { new: true }
      ).lean<Review>().exec();
    }
    const r = mockReviews.find((rv) => rv.id === id);
    if (!r || r.helpfulVoters.includes(customerId)) return r ?? null;
    if (vote === "up") r.helpfulVotes++;
    else r.unhelpfulVotes++;
    r.helpfulVoters.push(customerId);
    return r;
  }
};
