import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { UserModel } from "../models/user.model";
import { OrderModel } from "../models/order.model";
import { LoyaltyAccountModel } from "../models/loyalty.model";
import type { LoyaltyAccountDoc } from "../models/loyalty.model";
import { ReferralModel } from "../models/referral.model";
import { ReviewModel } from "../models/review.model";
import { CustomerNoteModel } from "../models/customer-note.model";
import { hasMongoConnection } from "../config/env";
import type { UserProfile } from "../shared/types";
import { sendCampaignEmail } from "../services/email.service";

// ─── Shared helpers ────────────────────────────────────────────

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function computeSegment(ltv: number, lastOrderAt: string | null): "top" | "active" | "lapsed" {
  const sixtyDaysAgo = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();
  if (ltv >= 5000) return "top";
  if (lastOrderAt && lastOrderAt >= sixtyDaysAgo) return "active";
  return "lapsed";
}

type OrderAgg = { _id: string; orderCount: number; ltv: number; lastOrderAt: string };

async function getOrderStatsMap(): Promise<Map<string, { orderCount: number; ltv: number; lastOrderAt: string }>> {
  const aggs: OrderAgg[] = await OrderModel.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $group: { _id: "$customerId", orderCount: { $sum: 1 }, ltv: { $sum: "$total" }, lastOrderAt: { $max: "$createdAt" } } }
  ]);
  return new Map(aggs.map((a) => [a._id, { orderCount: a.orderCount, ltv: a.ltv, lastOrderAt: a.lastOrderAt }]));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── GET /admin/customers ──────────────────────────────────────

export const listCustomersController: RequestHandler = asyncHandler(async (req, res) => {
  if (!hasMongoConnection) {
    sendSuccess(res, { data: [], total: 0, page: 1, limit: 50 }, "Customers fetched");
    return;
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const search = (req.query.search as string | undefined) ?? "";
  const segment = (req.query.segment as string | undefined) ?? "all";
  const tier = (req.query.tier as string | undefined) ?? "";

  const statsMap = await getOrderStatsMap();
  const sixtyDaysAgo = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();

  const query: Record<string, unknown> = { role: "CUSTOMER" };
  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
      { phoneNumber: { $regex: safeSearch, $options: "i" } }
    ];
  }

  // Positive-filter IDs (segment=top/active or tier)
  let allowedIds: string[] | null = null;
  // Negative-filter IDs (segment=lapsed = exclude actives)
  let excludedIds: string[] = [];

  if (segment === "top") {
    allowedIds = [...statsMap.entries()].filter(([, s]) => s.ltv >= 5000).map(([id]) => id);
  } else if (segment === "active") {
    allowedIds = [...statsMap.entries()].filter(([, s]) => s.lastOrderAt && s.lastOrderAt >= sixtyDaysAgo).map(([id]) => id);
  } else if (segment === "lapsed") {
    excludedIds = [...statsMap.entries()].filter(([, s]) => s.lastOrderAt && s.lastOrderAt >= sixtyDaysAgo).map(([id]) => id);
  }

  if (tier) {
    const loyaltyDocs = await LoyaltyAccountModel.find({ tier }).lean<LoyaltyAccountDoc[]>();
    const tierIds = loyaltyDocs.map((d) => d.userId);
    if (excludedIds.length > 0) {
      // lapsed + tier: users in tier who are NOT active
      allowedIds = tierIds.filter((id) => !excludedIds.includes(id));
      excludedIds = [];
    } else if (allowedIds !== null) {
      allowedIds = allowedIds.filter((id) => tierIds.includes(id));
    } else {
      allowedIds = tierIds;
    }
  }

  if (allowedIds !== null) {
    query.id = { $in: allowedIds };
  } else if (excludedIds.length > 0) {
    query.id = { $nin: excludedIds };
  }

  const [total, users] = await Promise.all([
    UserModel.countDocuments(query),
    UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<UserProfile[]>()
  ]);

  const userIds = users.map((u) => u.id);
  const loyaltyAccounts = await LoyaltyAccountModel.find({ userId: { $in: userIds } }).lean<LoyaltyAccountDoc[]>();
  const loyaltyMap = new Map(loyaltyAccounts.map((l) => [l.userId, l]));

  const data = users.map((u) => {
    const stats = statsMap.get(u.id);
    const loyalty = loyaltyMap.get(u.id);
    const ltv = stats?.ltv ?? 0;
    const lastOrderAt = stats?.lastOrderAt ?? null;
    return {
      id: u.id,
      name: u.name ?? null,
      email: u.email ?? null,
      phoneNumber: u.phoneNumber ?? null,
      createdAt: u.createdAt,
      orderCount: stats?.orderCount ?? 0,
      ltv,
      lastOrderAt,
      tier: loyalty?.tier ?? "Bronze",
      loyaltyPoints: loyalty?.points ?? 0,
      segment: computeSegment(ltv, lastOrderAt)
    };
  });

  sendSuccess(res, { data, total, page, limit }, "Customers fetched");
});

// ─── GET /admin/customers/:id ──────────────────────────────────

export const getCustomerProfileController: RequestHandler = asyncHandler(async (req, res) => {
  if (!hasMongoConnection) {
    res.status(404).json({ success: false, message: "Customer not found" });
    return;
  }

  const { id } = req.params;
  const user = await UserModel.findOne({ id }).lean<UserProfile>();
  if (!user) {
    res.status(404).json({ success: false, message: "Customer not found" });
    return;
  }

  const [orders, ltvAgg, loyalty, referral, reviewCount, notes] = await Promise.all([
    OrderModel.find({ customerId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    OrderModel.aggregate([
      { $match: { customerId: id, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, lastOrderAt: { $max: "$createdAt" } } }
    ]),
    LoyaltyAccountModel.findOne({ userId: id }).lean<LoyaltyAccountDoc>(),
    ReferralModel.findOne({ userId: id }).lean(),
    ReviewModel.countDocuments({ customerId: id }),
    CustomerNoteModel.find({ userId: id }).sort({ createdAt: -1 }).lean()
  ]);

  const ltv = (ltvAgg[0]?.total ?? 0) as number;
  const lastOrderAt = (ltvAgg[0]?.lastOrderAt ?? null) as string | null;

  const cleanOrders = orders.map((o) => {
    const { _id, __v, ...rest } = o as Record<string, unknown>;
    void _id; void __v;
    return rest;
  });

  const cleanNotes = notes.map((n) => {
    const raw = n as Record<string, unknown>;
    return {
      id: String(raw._id),
      userId: raw.userId,
      note: raw.note,
      createdBy: raw.createdBy,
      createdAt: raw.createdAt
    };
  });

  const totalOrderCount = (ltvAgg[0]?.count as number | undefined) ?? orders.length;

  sendSuccess(res, {
    user,
    orders: cleanOrders,
    ltv,
    orderCount: totalOrderCount,
    lastOrderAt,
    loyalty: loyalty
      ? { points: loyalty.points, lifetimePoints: loyalty.lifetimePoints, tier: loyalty.tier }
      : null,
    referral: referral
      ? { code: (referral as Record<string, unknown>).code, usedCount: ((referral as Record<string, unknown>).usedBy as unknown[]).length }
      : null,
    reviewCount,
    notes: cleanNotes,
    segment: computeSegment(ltv, lastOrderAt)
  }, "Customer profile fetched");
});

// ─── POST /admin/customers/:id/note ───────────────────────────

const addNoteSchema = z.object({ note: z.string().min(1).max(1000) });

export const addCustomerNoteController: RequestHandler = asyncHandler(async (req, res) => {
  if (!hasMongoConnection) {
    res.status(503).json({ success: false, message: "Database not available" });
    return;
  }

  const { id } = req.params;
  const user = await UserModel.findOne({ id }).lean();
  if (!user) {
    res.status(404).json({ success: false, message: "Customer not found" });
    return;
  }

  const { note } = addNoteSchema.parse(req.body);
  const now = new Date().toISOString();
  const doc = await CustomerNoteModel.create({ userId: id, note, createdBy: "admin", createdAt: now });

  sendSuccess(res, { id: String(doc._id), userId: id, note, createdBy: "admin", createdAt: now }, "Note added", 201);
});

// ─── POST /admin/customers/email-segment ──────────────────────

const emailSegmentSchema = z.object({
  segment: z.enum(["all", "lapsed", "top", "active"]),
  tier: z.string().optional(),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(5000)
});

export const emailSegmentController: RequestHandler = asyncHandler(async (req, res) => {
  if (!hasMongoConnection) {
    res.status(503).json({ success: false, message: "Database not available" });
    return;
  }

  const { segment, tier, subject, body } = emailSegmentSchema.parse(req.body);
  const sixtyDaysAgo = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();

  const statsMap = await getOrderStatsMap();

  let allowedIds: string[] | null = null;
  let excludedIds: string[] = [];

  if (segment === "top") {
    allowedIds = [...statsMap.entries()].filter(([, s]) => s.ltv >= 5000).map(([id]) => id);
  } else if (segment === "active") {
    allowedIds = [...statsMap.entries()].filter(([, s]) => s.lastOrderAt && s.lastOrderAt >= sixtyDaysAgo).map(([id]) => id);
  } else if (segment === "lapsed") {
    excludedIds = [...statsMap.entries()].filter(([, s]) => s.lastOrderAt && s.lastOrderAt >= sixtyDaysAgo).map(([id]) => id);
  }

  if (tier) {
    const loyaltyDocs = await LoyaltyAccountModel.find({ tier }).lean<LoyaltyAccountDoc[]>();
    const tierIds = loyaltyDocs.map((d) => d.userId);
    if (excludedIds.length > 0) {
      allowedIds = tierIds.filter((id) => !excludedIds.includes(id));
      excludedIds = [];
    } else if (allowedIds !== null) {
      allowedIds = allowedIds.filter((id) => tierIds.includes(id));
    } else {
      allowedIds = tierIds;
    }
  }

  const query: Record<string, unknown> = { role: "CUSTOMER", "emailPrefs.marketing": true };
  if (allowedIds !== null) {
    query.id = { $in: allowedIds };
  } else if (excludedIds.length > 0) {
    query.id = { $nin: excludedIds };
  }

  const users = await UserModel.find(query).select("email name id").lean<UserProfile[]>();
  const recipients = users.filter((u) => u.email).map((u) => ({ email: u.email!, name: u.name ?? "Valued Customer" }));

  const result = await sendCampaignEmail(subject, body, recipients);

  sendSuccess(res, result, `Campaign queued for ${result.sent} recipients`);
});
