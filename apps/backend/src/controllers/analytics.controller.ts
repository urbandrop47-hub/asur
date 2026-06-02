import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { hasMongoConnection } from "../config/env";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { mockStore } from "../repositories/mock-store";

const PAID_STATUSES = ["paid", "processing", "packed", "shipped", "delivered"];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ── GET /api/v1/admin/analytics ───────────────────────────────────────────────
export const getAnalyticsController: RequestHandler = asyncHandler(async (_req, res) => {
  if (hasMongoConnection) {
    const now = new Date();
    const d7 = daysAgo(7).toISOString();
    const d30 = daysAgo(30).toISOString();
    const d60 = daysAgo(60).toISOString();

    const [
      gmv30Agg, gmv7Agg,
      gmv30PrevAgg, gmv7PrevAgg,
      orders30Agg, orders7Agg,
      orders30PrevAgg, orders7PrevAgg,
      topProductsAgg
    ] = await Promise.all([
      // GMV 30d
      OrderModel.aggregate([
        { $match: { status: { $in: PAID_STATUSES }, createdAt: { $gte: d30 } } },
        { $group: { _id: null, gmv: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // GMV 7d
      OrderModel.aggregate([
        { $match: { status: { $in: PAID_STATUSES }, createdAt: { $gte: d7 } } },
        { $group: { _id: null, gmv: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // GMV prev 30d (30–60 days ago)
      OrderModel.aggregate([
        { $match: { status: { $in: PAID_STATUSES }, createdAt: { $gte: d60, $lt: d30 } } },
        { $group: { _id: null, gmv: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // GMV prev 7d (7–14 days ago)
      OrderModel.aggregate([
        { $match: { status: { $in: PAID_STATUSES }, createdAt: { $gte: daysAgo(14).toISOString(), $lt: d7 } } },
        { $group: { _id: null, gmv: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // Orders 30d
      OrderModel.countDocuments({ status: { $in: PAID_STATUSES }, createdAt: { $gte: d30 } }),
      // Orders 7d
      OrderModel.countDocuments({ status: { $in: PAID_STATUSES }, createdAt: { $gte: d7 } }),
      // Orders prev 30d
      OrderModel.countDocuments({ status: { $in: PAID_STATUSES }, createdAt: { $gte: d60, $lt: d30 } }),
      // Orders prev 7d
      OrderModel.countDocuments({ status: { $in: PAID_STATUSES }, createdAt: { $gte: daysAgo(14).toISOString(), $lt: d7 } }),
      // Top 5 products by revenue (last 30d)
      OrderModel.aggregate([
        { $match: { status: { $in: PAID_STATUSES }, createdAt: { $gte: d30 } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.productId", title: { $first: "$items.title" }, revenue: { $sum: "$items.totalPrice" }, units: { $sum: "$items.quantity" } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ])
    ]);

    const gmv30 = gmv30Agg[0]?.gmv ?? 0;
    const gmv7 = gmv7Agg[0]?.gmv ?? 0;
    const gmv30Prev = gmv30PrevAgg[0]?.gmv ?? 0;
    const gmv7Prev = gmv7PrevAgg[0]?.gmv ?? 0;
    const orders30 = orders30Agg;
    const orders7 = orders7Agg;
    const aov30 = orders30 > 0 ? Math.round(gmv30 / orders30) : 0;
    const aov30Prev = orders30PrevAgg > 0 ? Math.round(gmv30Prev / orders30PrevAgg) : 0;

    function pctChange(current: number, prev: number) {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    }

    const analytics = {
      gmv: {
        d7: gmv7,
        d30: gmv30,
        d7Change: pctChange(gmv7, gmv7Prev),
        d30Change: pctChange(gmv30, gmv30Prev)
      },
      orders: {
        d7: orders7,
        d30: orders30,
        d7Change: pctChange(orders7, orders7PrevAgg),
        d30Change: pctChange(orders30, orders30PrevAgg)
      },
      aov: {
        d30: aov30,
        d30Change: pctChange(aov30, aov30Prev)
      },
      topProducts: topProductsAgg.map((p: { _id: string; title: string; revenue: number; units: number }) => ({
        productId: p._id,
        title: p.title,
        revenue: p.revenue,
        units: p.units
      })),
      generatedAt: now.toISOString()
    };

    sendSuccess(res, analytics, "Analytics fetched");
    return;
  }

  // Mock fallback
  const paid = mockStore.orders.filter((o) => PAID_STATUSES.includes(o.status));
  const cutoff30 = daysAgo(30).toISOString();
  const cutoff7 = daysAgo(7).toISOString();
  const paid30 = paid.filter((o) => o.createdAt >= cutoff30);
  const paid7 = paid.filter((o) => o.createdAt >= cutoff7);
  const gmv30 = paid30.reduce((s, o) => s + o.total, 0);
  const gmv7 = paid7.reduce((s, o) => s + o.total, 0);

  sendSuccess(res, {
    gmv: { d7: gmv7, d30: gmv30, d7Change: 0, d30Change: 0 },
    orders: { d7: paid7.length, d30: paid30.length, d7Change: 0, d30Change: 0 },
    aov: { d30: paid30.length > 0 ? Math.round(gmv30 / paid30.length) : 0, d30Change: 0 },
    topProducts: [],
    generatedAt: new Date().toISOString()
  }, "Analytics fetched (mock)");
});

// ── GET /api/v1/admin/analytics/revenue-chart ─────────────────────────────────
export const getRevenueChartController: RequestHandler = asyncHandler(async (_req, res) => {
  // Build list of the last 30 day labels
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(isoDay(d));
  }

  if (hasMongoConnection) {
    const cutoff = daysAgo(30).toISOString();
    const agg = await OrderModel.aggregate([
      { $match: { status: { $in: PAID_STATUSES }, createdAt: { $gte: cutoff } } },
      { $group: { _id: { $substr: ["$createdAt", 0, 10] }, revenue: { $sum: "$total" }, count: { $sum: 1 } } }
    ]);

    const byDay = new Map(agg.map((d: { _id: string; revenue: number; count: number }) => [d._id, { revenue: d.revenue, count: d.count }]));
    const chart = days.map((day) => ({ day, revenue: byDay.get(day)?.revenue ?? 0, orders: byDay.get(day)?.count ?? 0 }));

    sendSuccess(res, { chart }, "Revenue chart fetched");
    return;
  }

  const paid = mockStore.orders.filter((o) => PAID_STATUSES.includes(o.status));
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const order of paid) {
    const day = order.createdAt.slice(0, 10);
    const existing = byDay.get(day) ?? { revenue: 0, orders: 0 };
    byDay.set(day, { revenue: existing.revenue + order.total, orders: existing.orders + 1 });
  }
  const chart = days.map((day) => ({ day, revenue: byDay.get(day)?.revenue ?? 0, orders: byDay.get(day)?.orders ?? 0 }));
  sendSuccess(res, { chart }, "Revenue chart fetched (mock)");
});

// ── GET /api/v1/admin/analytics/export-csv ────────────────────────────────────
export const exportOrdersCsvController: RequestHandler = asyncHandler(async (_req, res) => {
  let orders;
  if (hasMongoConnection) {
    const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    orders = docs;
  } else {
    orders = [...mockStore.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const header = ["Order Number", "Date", "Customer ID", "Items", "Subtotal", "Discount", "Shipping", "GST", "Total", "Status", "Payment", "Coupon"];
  const rows = orders.map((o: Record<string, unknown>) => {
    const itemsSummary = ((o.items as Array<{ title: string; quantity: number }>) ?? [])
      .map((i) => `${i.title} x${i.quantity}`)
      .join(" | ");
    return [
      o.orderNumber,
      String(o.createdAt).slice(0, 10),
      o.customerId,
      `"${itemsSummary}"`,
      o.subtotal,
      o.discount ?? 0,
      o.shipping,
      o.tax,
      o.total,
      o.status,
      o.paymentStatus,
      o.couponCode ?? ""
    ].join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="asur-orders-${isoDay(new Date())}.csv"`);
  res.status(200).send(csv);
});
