import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createPaymentOrderController, verifyPaymentController } from "../controllers/payment.controller";
import { requireSession } from "../middlewares/require-session";

export const paymentsRouter: ExpressRouter = Router();

paymentsRouter.use(requireSession);
paymentsRouter.post("/razorpay/order", createPaymentOrderController);
paymentsRouter.post("/razorpay/verify", verifyPaymentController);
