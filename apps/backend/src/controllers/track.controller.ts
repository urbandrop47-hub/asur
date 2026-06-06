import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { OrderModel } from "../models/order.model";
import { UserModel } from "../models/user.model";
import { hasMongoConnection } from "../config/env";
import type { Order } from "../shared/types";
import type { UserProfile } from "../shared/types";

type OrderDoc = Order & { customerId: string; courierName?: string; trackingNumber?: string };

export const publicTrackController: RequestHandler = asyncHandler(async (req, res) => {
  if (!hasMongoConnection) {
    res.status(503).json({ success: false, message: "Service unavailable" });
    return;
  }

  const orderNumber = ((req.query.orderNumber as string) ?? "").trim().toUpperCase();
  const email = ((req.query.email as string) ?? "").trim().toLowerCase();

  if (!orderNumber || !email) {
    res.status(400).json({ success: false, message: "orderNumber and email are required" });
    return;
  }

  const order = await OrderModel.findOne({ orderNumber }).lean<OrderDoc>();
  if (!order) {
    // Use same message to avoid order enumeration
    res.status(404).json({ success: false, message: "No order found for that combination" });
    return;
  }

  const user = await UserModel.findOne({ id: order.customerId }).lean<UserProfile>();
  const customerEmail = user?.email?.trim().toLowerCase() ?? "";
  if (!customerEmail || customerEmail !== email) {
    res.status(404).json({ success: false, message: "No order found for that combination" });
    return;
  }

  sendSuccess(res, {
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber ?? null,
    courierName: order.courierName ?? null,
    createdAt: order.createdAt,
    shippingAddress: {
      fullName: order.shippingAddress.fullName,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode
    },
    items: order.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      variantSku: item.variantSku
    }))
  }, "Tracking info fetched");
});
