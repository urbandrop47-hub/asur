import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createPaymentOrderController, verifyPaymentController } from "../controllers/payment.controller";

export const paymentsRouter: ExpressRouter = Router();

// Ownership is enforced inside each controller:
//   - authenticated users: order.customerId === session userId
//   - guest users: order.guestPhone === body.guestPhone
// No blanket requireSession here — guest orders must be payable without a session.
paymentsRouter.post("/razorpay/order", createPaymentOrderController);
paymentsRouter.post("/razorpay/verify", verifyPaymentController);
