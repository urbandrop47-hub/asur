import type { RequestHandler } from "express";
import { z } from "zod";
import type { VendorTask } from "@asur/types";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { orderRepository } from "../repositories/order.repository";

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
  const task = await orderRepository.findVendorTaskById(id);
  if (!task) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }
  sendSuccess(res, task, "Task fetched");
});

export const updateVendorTaskController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = updateTaskSchema.parse(req.body);

  const task = await orderRepository.findVendorTaskById(id);
  if (!task) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  // Validate status transition
  if (body.status && body.status !== task.status) {
    const allowed = TRANSITIONS[task.status];
    if (!allowed.includes(body.status)) {
      res.status(400).json({
        success: false,
        message: `Cannot transition from "${task.status}" to "${body.status}". Allowed: ${allowed.join(", ") || "none"}`
      });
      return;
    }
    // Marking completed (shipped) requires tracking details
    if (body.status === "completed" && (!body.trackingId || !body.courierName)) {
      res.status(400).json({
        success: false,
        message: "trackingId and courierName are required before marking as completed"
      });
      return;
    }
  }

  const updates: Partial<Omit<VendorTask, "id">> = {};
  if (body.status) updates.status = body.status;
  if (body.trackingId) updates.trackingId = body.trackingId;
  if (body.courierName) updates.courierName = body.courierName;
  if (body.notes !== undefined) updates.notes = body.notes;

  const updated = await orderRepository.updateVendorTask(id, updates);

  // When completed, update the parent order's fulfillmentStatus to "shipped"
  if (body.status === "completed" && updated) {
    await orderRepository.updateStatus(updated.orderId, "shipped");
  }

  sendSuccess(res, updated, "Task updated");
});
