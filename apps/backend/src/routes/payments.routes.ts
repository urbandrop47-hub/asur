import { Router } from "express";
import { createPaymentOrderController, verifyPaymentController } from "../controllers/payment.controller";

export const paymentsRouter = Router();

paymentsRouter.post("/razorpay/order", createPaymentOrderController);
paymentsRouter.post("/razorpay/verify", verifyPaymentController);
