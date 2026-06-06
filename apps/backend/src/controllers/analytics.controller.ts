import type { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { hasMongoConnection } from "../config/env";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { SearchEventModel } from "../models/search-event.model";
import { mockStore } from "../repositories/mock-store";

const PAID_STATUSES = ["paid", "processing", "packed", "shipped", "delivered"];

function daysAgo(n: number): Date {
  // Use UTC arithmetic so the cutoff and isoDay both operate in the same timezone.
  // setHours(0,0,0,0) uses local time which misaligns with toISOString() (UTC) on
  // non-UTC servers — use setUTCHours instead to keep everything in UTC.
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10); // already UTC
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
export const getRevenueChartController: RequestHandler = asyncHandler(async (req, res) => {
  const numDays = Math.max(7, Math.min(90, Number(req.query.days) || 30));

  // Build list of the last N UTC day labels (matches isoDay which uses UTC)
  const days: string[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(isoDay(d));
  }

  if (hasMongoConnection) {
    const cutoff = daysAgo(numDays).toISOString();
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

// ── GET /api/v1/admin/analytics/search ───────────────────────────────────────
export const getSearchAnalyticsController: RequestHandler = asyncHandler(async (_req, res) => {
  if (hasMongoConnection) {
    const cutoff30 = daysAgo(30).toISOString();
    const [topQueries, zeroResultQueries, totalSearches] = await Promise.all([
      // Top 10 queries by volume (last 30d)
      SearchEventModel.aggregate([
        { $match: { createdAt: { $gte: cutoff30 } } },
        { $group: { _id: "$query", count: { $sum: 1 }, avgResults: { $avg: "$resultsCount" } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // Top 10 zero-result queries
      SearchEventModel.aggregate([
        { $match: { createdAt: { $gte: cutoff30 }, resultsCount: 0 } },
        { $group: { _id: "$query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      SearchEventModel.countDocuments({ createdAt: { $gte: cutoff30 } })
    ]);

    sendSuccess(res, {
      totalSearches,
      topQueries: topQueries.map((q: { _id: string; count: number; avgResults: number }) => ({
        query: q._id,
        count: q.count,
        avgResults: Math.round(q.avgResults)
      })),
      zeroResultQueries: zeroResultQueries.map((q: { _id: string; count: number }) => ({
        query: q._id,
        count: q.count
      }))
    }, "Search analytics fetched");
    return;
  }

  // Mock fallback
  sendSuccess(res, {
    totalSearches: 0,
    topQueries: [],
    zeroResultQueries: []
  }, "Search analytics fetched (mock)");
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
    // Escape embedded double-quotes by doubling them (RFC 4180)
    const escapedItems = `"${itemsSummary.replace(/"/g, '""')}"`;
    return [
      o.orderNumber,
      String(o.createdAt).slice(0, 10),
      o.customerId,
      escapedItems,
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

  // RFC 4180 requires CRLF line endings for broad compatibility (Excel on Windows)
  const csv = [header.join(","), ...rows].join("\r\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="asur-orders-${isoDay(new Date())}.csv"`);
  res.status(200).send(csv);
});

// ── GET /api/v1/admin/orders/stream (SSE) ─────────────────────────────────────
export function orderStreamController(req: Request, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let lastCheckedAt = new Date().toISOString();
  let lastCheckedId = "";

  // Heartbeat every 25s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    res.write(":heartbeat\n\n");
  }, 25000);

  const poll = setInterval(async () => {
    try {
      if (!hasMongoConnection) return;
      const newOrders = await OrderModel.find({
        $or: [
          { createdAt: { $gt: lastCheckedAt } },
          ...(lastCheckedId ? [{ createdAt: lastCheckedAt, _id: { $gt: lastCheckedId } }] : [])
        ]
      })
        .sort({ createdAt: 1, _id: 1 })
        .lean();
      if (newOrders.length > 0) {
        const newest = newOrders[newOrders.length - 1];
        lastCheckedAt = String(newest.createdAt ?? lastCheckedAt);
        lastCheckedId = String(newest._id ?? lastCheckedId);
        const payload = newOrders.map((o) => ({
          id: String(o._id),
          orderNumber: (o as { orderNumber?: string }).orderNumber ?? String(o._id).slice(-6).toUpperCase(),
          total: (o as { total?: number }).total ?? 0,
          status: (o as { status?: string }).status ?? "pending_payment",
        }));
        res.write(`data: ${JSON.stringify({ type: "new_orders", orders: payload })}\n\n`);
      }
    } catch {
      // ignore transient poll errors
    }
  }, 5000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(poll);
  });
}
