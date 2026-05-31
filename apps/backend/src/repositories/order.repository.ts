import type { Address, FulfillmentStatus, Order, Payment, PaymentStatus, VendorTask } from "@asur/types";
import type { CreateOrderInput } from "@asur/validations";
import { hasMongoConnection } from "../config/env";
import { createId } from "../lib/id";
import { mockStore } from "./mock-store";

function toOrderNumber() {
  return `ASUR-${Date.now().toString(36).toUpperCase()}`;
}

function createLineItems(items: CreateOrderInput["items"]) {
  return items.map((item) => ({
    productId: item.productId,
    title: item.variantSku,
    variantSku: item.variantSku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.quantity * item.unitPrice
  }));
}

export const orderRepository = {
  async create(input: CreateOrderInput & { paymentStatus?: PaymentStatus; fulfillmentStatus?: FulfillmentStatus }) {
    const now = new Date().toISOString();
    const items = createLineItems(input.items);
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const shipping = subtotal >= 150000 ? 0 : 25000; // free above ₹1500
    const tax = Math.round(subtotal * 0.18);          // 18% GST
    const total = subtotal + shipping + tax;

    const order: Order = {
      id: createId("ord"),
      orderNumber: toOrderNumber(),
      customerId: input.customerId,
      items,
      subtotal,
      shipping,
      tax,
      total,
      currency: "INR",
      status: "pending_payment",
      paymentStatus: input.paymentStatus ?? "pending",
      fulfillmentStatus: input.fulfillmentStatus ?? "unassigned",
      shippingAddress: input.shippingAddress as Address,
      createdAt: now,
      updatedAt: now
    };

    if (!hasMongoConnection) {
      mockStore.orders.push(order);
    }
    // MongoDB persistence will be added in S4-T1 when OrderModel is wired up
    return order;
  },

  async listByCustomer(customerId: string) {
    return mockStore.orders.filter((o) => o.customerId === customerId);
  },

  async findById(id: string, customerId: string) {
    return mockStore.orders.find((o) => o.id === id && o.customerId === customerId) ?? null;
  },

  async updateStatus(id: string, status: Order["status"]) {
    const order = mockStore.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
    }
    return order ?? null;
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    const order = mockStore.orders.find((o) => o.id === id);
    if (order) {
      order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
    }
    return order ?? null;
  },

  async updateProviderOrderId(id: string, providerOrderId: string) {
    const order = mockStore.orders.find((o) => o.id === id) as (Order & { providerOrderId?: string }) | undefined;
    if (order) {
      order.providerOrderId = providerOrderId;
    }
    return order ?? null;
  },

  async createVendorTask(orderId: string) {
    const task: VendorTask = {
      id: createId("task"),
      orderId,
      status: "pending",
      updatedAt: new Date().toISOString()
    };
    mockStore.vendorTasks.push(task);
    return task;
  },

  async ensureVendorTask(orderId: string) {
    const existing = mockStore.vendorTasks.find((t) => t.orderId === orderId);
    if (!existing) return this.createVendorTask(orderId);
    return existing;
  },

  async createPayment(input: { orderId: string; amount: number; currency: "INR"; providerOrderId?: string }) {
    const payment: Payment = {
      id: createId("pay"),
      orderId: input.orderId,
      provider: "razorpay",
      providerOrderId: input.providerOrderId,
      status: "pending",
      amount: input.amount,
      currency: input.currency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockStore.payments.push(payment);
    return payment;
  }
};
