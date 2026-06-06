import type { RequestHandler } from "express";
import { z } from "zod";
import type { VendorTask } from "@asur/types";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { orderRepository } from "../repositories/order.repository";
import { userRepository } from "../repositories/user.repository";
import { sendShippingUpdateEmail } from "../services/email.service";
import { hasMongoConnection } from "../config/env";
import { VendorTaskModel } from "../models/vendor-task.model";

// Status transitions: each key can move to any value in its array
const TRANSITIONS: Record<VendorTask["status"], VendorTask["status"][]> = {
  pending: ["in_progress"],
  in_progress: ["ready_to_ship"],
  ready_to_ship: ["completed"],
  completed: []
};

const updateTaskSchema = z.object({
  status: z.enum(["pending", "in_progress", "ready_to_ship", "completed"]).optional(),
  trackingId: z.string().min(1).optional(),
  courierName: z.string().min(1).optional(),
  notes: z.string().optional()
});

export const listVendorTasksController: RequestHandler = asyncHandler(async (_req, res) => {
  const user = res.locals.user;
  // Admins see all tasks; vendors see only tasks assigned to them or unassigned
  const vendorId = user.role === "VENDOR" ? user.id : undefined;
  const tasks = await orderRepository.listVendorTasks(vendorId);
  sendSuccess(res, tasks, "Tasks fetched");
});

export const getVendorTaskController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = res.locals.user;
  const task = await orderRepository.findVendorTaskById(id);
  if (!task) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }
  // Vendors may only view their own tasks; admins/super-admins see all
  if (user.role === "VENDOR" && task.vendorId && task.vendorId !== user.id) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }
  sendSuccess(res, task, "Task fetched");
});

export const updateVendorTaskController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = res.locals.user;
  const body = updateTaskSchema.parse(req.body);

  const task = await orderRepository.findVendorTaskById(id);
  if (!task) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  // Vendors may only update tasks explicitly assigned to them.
  // Unassigned tasks (vendorId = null/undefined) are admin-only until assigned.
  if (user.role === "VENDOR" && task.vendorId !== user.id) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }

  // Validate status transition (including same-status re-send, which is always invalid)
  if (body.status) {
    if (body.status === task.status) {
      res.status(400).json({
        success: false,
        message: `Task is already in status "${task.status}"`
      });
      return;
    }
    const allowed = TRANSITIONS[task.status];
    if (!allowed.includes(body.status)) {
      res.status(400).json({
        success: false,
        message: `Cannot transition from "${task.status}" to "${body.status}". Allowed: ${allowed.join(", ") || "none"}`
      });
      return;
    }
    // Marking completed (shipped) requires tracking details
    if (body.status === "completed") {
      const trackingId = body.trackingId ?? task.trackingId;
      const courierName = body.courierName ?? task.courierName;
      if (!trackingId || !courierName) {
        res.status(400).json({
          success: false,
          message: "trackingId and courierName are required before marking as completed"
        });
        return;
      }
    }
  }

  const updates: Partial<Omit<VendorTask, "id">> = {};
  if (body.status) updates.status = body.status;
  if (body.trackingId) updates.trackingId = body.trackingId;
  if (body.courierName) updates.courierName = body.courierName;
  if (body.notes !== undefined) updates.notes = body.notes;

  const updated = await orderRepository.updateVendorTask(id, updates);

  // Sync order fulfillmentStatus to mirror vendor task progress at every transition
  if (body.status && updated) {
    const fulfillmentMap: Record<string, "in_progress" | "ready_to_ship" | "shipped"> = {
      in_progress: "in_progress",
      ready_to_ship: "ready_to_ship",
      completed: "shipped"
    };
    const nextFulfillment = fulfillmentMap[body.status];
    if (nextFulfillment) {
      await orderRepository.updateFulfillmentStatus(updated.orderId, nextFulfillment);
    }
  }

  // When completed, advance the order's overall status to "shipped" —
  // but only if the order is currently in a shippable state to avoid
  // accidentally re-opening a cancelled or still-pending order.
  const SHIPPABLE_STATUSES = ["paid", "processing", "packed"];
  if (body.status === "completed" && updated) {
    const order = await orderRepository.findByIdAdmin(updated.orderId);
    if (order && SHIPPABLE_STATUSES.includes(order.status)) {
      await orderRepository.updateStatus(updated.orderId, "shipped");
      // Copy tracking details from task onto the order so the customer API returns them
      const tNumber = updated.trackingId ?? "";
      const cName = updated.courierName ?? "";
      if (tNumber && cName) {
        await orderRepository.updateTracking(updated.orderId, tNumber, cName);
      }
    }
    if (!order || !SHIPPABLE_STATUSES.includes(order.status)) {
      // Log the mismatch but don't fail the vendor task update
      console.warn(`[vendor] task ${id} completed but order ${updated.orderId} is in status "${order?.status}" — skipping ship transition`);
    }

    // Fire-and-forget shipping email — never breaks the vendor flow on failure
    void (async () => {
      const order = await orderRepository.findByIdAdmin(updated.orderId);
      if (!order) return;
      const customer = order.customerId ? await userRepository.findById(order.customerId) : null;
      const customerEmail = customer?.email ?? "";
      const customerName = customer?.name ?? "there";
      if (customerEmail) {
        await sendShippingUpdateEmail(order, updated, customerEmail, customerName);
      }
    })();
  }

  sendSuccess(res, updated, "Task updated");
});

// ── GET /api/v1/admin/vendor-performance ──────────────────────────────────────
export const getVendorPerformanceController: RequestHandler = asyncHandler(async (_req, res) => {
  if (hasMongoConnection) {
    const agg = await VendorTaskModel.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$vendorId", "unassigned"] },
          pending:      { $sum: { $cond: [{ $eq: ["$status", "pending"] },       1, 0] } },
          in_progress:  { $sum: { $cond: [{ $eq: ["$status", "in_progress"] },   1, 0] } },
          ready_to_ship:{ $sum: { $cond: [{ $eq: ["$status", "ready_to_ship"] }, 1, 0] } },
          completed:    { $sum: { $cond: [{ $eq: ["$status", "completed"] },     1, 0] } },
          total:        { $sum: 1 }
        }
      },
      { $sort: { completed: -1 } }
    ]);
    const vendors = agg.map((v: Record<string, unknown>) => ({ vendorId: v._id, ...v, _id: undefined }));
    sendSuccess(res, { vendors }, "Vendor performance fetched");
    return;
  }

  // Mock fallback: group the mock store vendor tasks
  const tasks = await orderRepository.listVendorTasks();
  type PerfRow = { vendorId: string; pending: number; in_progress: number; ready_to_ship: number; completed: number; total: number };
  const map = new Map<string, PerfRow>();
  for (const t of tasks) {
    const key = t.vendorId ?? "unassigned";
    const entry: PerfRow = map.get(key) ?? { vendorId: key, pending: 0, in_progress: 0, ready_to_ship: 0, completed: 0, total: 0 };
    const s = t.status as "pending" | "in_progress" | "ready_to_ship" | "completed";
    entry[s] = entry[s] + 1;
    entry.total++;
    map.set(key, entry);
  }
  sendSuccess(res, { vendors: [...map.values()] }, "Vendor performance fetched (mock)");
});
