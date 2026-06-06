import type { Address, FulfillmentStatus, Order, Payment, PaymentStatus, VendorTask } from "@asur/types";
import type { CreateOrderInput } from "../shared/validations";
import { hasMongoConnection } from "../config/env";
import { createId } from "../lib/id";
import { OrderModel } from "../models/order.model";
import { PaymentModel } from "../models/payment.model";
import { VendorTaskModel } from "../models/vendor-task.model";
import { getOrderPricingConfig } from "../models/site-config.model";
import { mockStore } from "./mock-store";

function toOrderNumber() {
  // Combine timestamp with 4 random chars so same-millisecond orders are unique
  // and the sequence is not trivially guessable from the number alone.
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASUR-${ts}${rand}`;
}

function createLineItems(items: CreateOrderInput["items"]) {
  return items.map((item) => ({
    productId: item.productId,
    title: item.productTitle ?? item.variantSku,
    variantSku: item.variantSku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.quantity * item.unitPrice
  }));
}

function stripDoc<T>(doc: unknown): T {
  const obj = (doc as { toObject?: () => unknown }).toObject?.() ?? doc;
  const { _id, __v, ...rest } = obj as Record<string, unknown>;
  void _id; void __v;
  return rest as T;
}

export const orderRepository = {
  async create(input: CreateOrderInput & {
    paymentStatus?: PaymentStatus;
    fulfillmentStatus?: FulfillmentStatus;
    couponCode?: string;
    discountAmount?: number;
    freeShipping?: boolean;
    loyaltyPointsRedeemed?: number;
    loyaltyDiscount?: number;
    referralCode?: string;
    giftCardCode?: string;
    giftCardAmount?: number;
  }) {
    const now = new Date().toISOString();
    const items = createLineItems(input.items);
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Read live pricing constants from site config so admin changes take effect immediately.
    // Falls back to hardcoded defaults if MongoDB is unavailable.
    const { freeShippingThreshold, shippingFee, gstRate } = await getOrderPricingConfig();

    const baseShipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
    const shipping = input.freeShipping ? 0 : baseShipping;
    // For free_shipping coupons the monetary saving is the shipping amount waived;
    // for percent/fixed coupons it's the explicit discountAmount passed in.
    const discountAmount = input.freeShipping
      ? baseShipping                         // e.g. ₹250 shipping waived
      : (input.discountAmount ?? 0);
    // GST is computed on subtotal after coupon discount (loyalty discount applied post-tax)
    const subtotalDiscount = input.freeShipping ? 0 : discountAmount;
    const taxableAmount = Math.max(0, subtotal - subtotalDiscount);
    const tax = Math.round(taxableAmount * gstRate);
    const loyaltyDiscount = input.loyaltyDiscount ?? 0;
    const giftCardAmount = input.giftCardAmount ?? 0;
    const total = Math.max(0, taxableAmount + shipping + tax - loyaltyDiscount - giftCardAmount);

    const orderData: Order & { loyaltyPointsRedeemed?: number; loyaltyPointsEarned?: number; loyaltyDiscount?: number; referralCode?: string; giftCardCode?: string; giftCardAmount?: number } = {
      id: createId("ord"),
      orderNumber: toOrderNumber(),
      customerId: input.customerId,
      items,
      subtotal,
      shipping,
      tax,
      discount: discountAmount + loyaltyDiscount + giftCardAmount,
      total,
      currency: "INR" as const,
      status: "pending_payment",
      paymentStatus: input.paymentStatus ?? "pending",
      fulfillmentStatus: input.fulfillmentStatus ?? "unassigned",
      couponCode: input.couponCode,
      discountAmount,
      loyaltyPointsRedeemed: input.loyaltyPointsRedeemed ?? 0,
      loyaltyPointsEarned: 0,
      loyaltyDiscount,
      referralCode: input.referralCode,
      giftCardCode: input.giftCardCode,
      giftCardAmount,
      shippingAddress: input.shippingAddress as Address,
      createdAt: now,
      updatedAt: now
    };

    if (hasMongoConnection) {
      const doc = await OrderModel.create(orderData);
      return stripDoc<Order>(doc);
    }

    mockStore.orders.push(orderData);
    return orderData;
  },

  async listByCustomer(customerId: string) {
    if (hasMongoConnection) {
      const docs = await OrderModel.find({ customerId }).sort({ createdAt: -1 }).lean();
      return docs.map((doc) => {
        const { _id, __v, ...rest } = doc as Record<string, unknown>;
        void _id; void __v;
        return rest as Order;
      });
    }
    return mockStore.orders.filter((o) => o.customerId === customerId);
  },

  async findById(id: string, customerId: string) {
    if (hasMongoConnection) {
      const doc = await OrderModel.findOne({ id, customerId }).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Order;
    }
    return mockStore.orders.find((o) => o.id === id && o.customerId === customerId) ?? null;
  },

  async updateStatus(id: string, status: Order["status"]) {
    if (hasMongoConnection) {
      const doc = await OrderModel.findOneAndUpdate(
        { id },
        { status, updatedAt: new Date().toISOString() },
        { new: true }
      ).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Order;
    }
    const order = mockStore.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
    }
    return order ?? null;
  },

  /** Conditionally update status only when current status is NOT in `excludedStatuses`.
   *  Returns the updated order, or null if the condition wasn't met (concurrent transition). */
  async updateStatusConditional(id: string, status: Order["status"], excludedStatuses: string[]) {
    if (hasMongoConnection) {
      const doc = await OrderModel.findOneAndUpdate(
        { id, status: { $nin: excludedStatuses } },
        { status, updatedAt: new Date().toISOString() },
        { new: true }
      ).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Order;
    }
    const order = mockStore.orders.find((o) => o.id === id);
    if (!order || excludedStatuses.includes(order.status)) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return order;
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    if (hasMongoConnection) {
      const doc = await OrderModel.findOneAndUpdate(
        { id },
        { paymentStatus, updatedAt: new Date().toISOString() },
        { new: true }
      ).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Order;
    }
    const order = mockStore.orders.find((o) => o.id === id);
    if (order) {
      order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
    }
    return order ?? null;
  },

  async updateTracking(id: string, trackingNumber: string, courierName: string) {
    if (hasMongoConnection) {
      const doc = await OrderModel.findOneAndUpdate(
        { id },
        { trackingNumber, courierName, updatedAt: new Date().toISOString() },
        { new: true }
      ).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Order;
    }
    const order = mockStore.orders.find((o) => o.id === id);
    if (order) {
      (order as Order & { trackingNumber?: string; courierName?: string }).trackingNumber = trackingNumber;
      (order as Order & { courierName?: string }).courierName = courierName;
      order.updatedAt = new Date().toISOString();
    }
    return order ?? null;
  },

  async updateFulfillmentStatus(id: string, fulfillmentStatus: FulfillmentStatus) {
    if (hasMongoConnection) {
      const doc = await OrderModel.findOneAndUpdate(
        { id },
        { fulfillmentStatus, updatedAt: new Date().toISOString() },
        { new: true }
      ).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Order;
    }
    const order = mockStore.orders.find((o) => o.id === id);
    if (order) {
      order.fulfillmentStatus = fulfillmentStatus;
      order.updatedAt = new Date().toISOString();
    }
    return order ?? null;
  },

  async updateProviderOrderId(id: string, providerOrderId: string) {
    if (hasMongoConnection) {
      const doc = await OrderModel.findOneAndUpdate(
        { id },
        { providerOrderId },
        { new: true }
      ).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Order & { providerOrderId?: string };
    }
    const order = mockStore.orders.find((o) => o.id === id) as (Order & { providerOrderId?: string }) | undefined;
    if (order) {
      order.providerOrderId = providerOrderId;
    }
    return order ?? null;
  },

  async createVendorTask(orderId: string) {
    const taskData: VendorTask = {
      id: createId("task"),
      orderId,
      status: "pending",
      updatedAt: new Date().toISOString()
    };

    if (hasMongoConnection) {
      const doc = await VendorTaskModel.create(taskData);
      return stripDoc<VendorTask>(doc);
    }

    mockStore.vendorTasks.push(taskData);
    return taskData;
  },

  async ensureVendorTask(orderId: string) {
    if (hasMongoConnection) {
      const doc = await VendorTaskModel.findOne({ orderId }).lean();
      if (doc) {
        const { _id, __v, ...rest } = doc as Record<string, unknown>;
        void _id; void __v;
        return rest as VendorTask;
      }
      return this.createVendorTask(orderId);
    }
    const existing = mockStore.vendorTasks.find((t) => t.orderId === orderId);
    if (!existing) return this.createVendorTask(orderId);
    return existing;
  },

  async listVendorTasks(vendorId?: string) {
    if (hasMongoConnection) {
      const query = vendorId ? { $or: [{ vendorId }, { vendorId: { $exists: false } }] } : {};
      const docs = await VendorTaskModel.find(query).sort({ updatedAt: -1 }).lean();
      return docs.map((doc) => {
        const { _id, __v, ...rest } = doc as Record<string, unknown>;
        void _id; void __v;
        return rest as VendorTask;
      });
    }
    const tasks = vendorId
      ? mockStore.vendorTasks.filter((t) => !t.vendorId || t.vendorId === vendorId)
      : mockStore.vendorTasks;
    return [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async findVendorTaskById(id: string) {
    if (hasMongoConnection) {
      const doc = await VendorTaskModel.findOne({ id }).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as VendorTask;
    }
    return mockStore.vendorTasks.find((t) => t.id === id) ?? null;
  },

  async updateVendorTask(id: string, updates: Partial<Omit<VendorTask, "id">>) {
    const now = new Date().toISOString();
    const patch = { ...updates, updatedAt: now };
    if (hasMongoConnection) {
      const doc = await VendorTaskModel.findOneAndUpdate({ id }, patch, { new: true }).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as VendorTask;
    }
    const task = mockStore.vendorTasks.find((t) => t.id === id);
    if (!task) return null;
    Object.assign(task, patch);
    return task;
  },

  async listAll() {
    if (hasMongoConnection) {
      const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
      return docs.map((doc) => {
        const { _id, __v, ...rest } = doc as Record<string, unknown>;
        void _id; void __v;
        return rest as Order;
      });
    }
    return [...mockStore.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findByIdAdmin(id: string) {
    if (hasMongoConnection) {
      const doc = await OrderModel.findOne({ id }).lean();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Order;
    }
    return mockStore.orders.find((o) => o.id === id) ?? null;
  },

  /** Count orders by a customer that used a specific coupon — for per-customer limit checks. */
  async countByCustomerAndCoupon(customerId: string, couponCode: string): Promise<number> {
    const upper = couponCode.toUpperCase();
    if (hasMongoConnection) {
      return OrderModel.countDocuments({ customerId, couponCode: upper, status: { $ne: "cancelled" } });
    }
    return mockStore.orders.filter(
      (o) => o.customerId === customerId && (o as Order & { couponCode?: string }).couponCode === upper && o.status !== "cancelled"
    ).length;
  },

  async createPayment(input: { orderId: string; amount: number; currency: "INR"; providerOrderId?: string; providerPaymentId?: string; status?: Payment["status"] }) {
    const paymentData: Payment = {
      id: createId("pay"),
      orderId: input.orderId,
      provider: "razorpay",
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      status: input.status ?? "pending",
      amount: input.amount,
      currency: input.currency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (hasMongoConnection) {
      const doc = await PaymentModel.create(paymentData);
      return stripDoc<Payment>(doc);
    }

    mockStore.payments.push(paymentData);
    return paymentData;
  },

  async findPaymentByOrderId(orderId: string) {
    if (hasMongoConnection) {
      const doc = await PaymentModel.findOne({ orderId }).sort({ createdAt: -1 }).lean<Payment>().exec();
      if (!doc) return null;
      const { _id, __v, ...rest } = doc as Record<string, unknown>;
      void _id; void __v;
      return rest as Payment;
    }
    return mockStore.payments.find((p) => p.orderId === orderId) ?? null;
  }
};
