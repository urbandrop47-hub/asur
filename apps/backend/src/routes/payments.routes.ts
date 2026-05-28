import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createPaymentOrderController, verifyPaymentController } from "../controllers/payment.controller";

export const paymentsRouter: ExpressRouter = Router();

paymentsRouter.post("/razorpay/order", createPaymentOrderController);
paymentsRouter.post("/razorpay/verify", verifyPaymentController);
