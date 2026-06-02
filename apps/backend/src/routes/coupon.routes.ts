import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { optionalSession } from "../middlewares/optional-session";
import { validateCouponController } from "../controllers/coupon.controller";

export const couponRouter: ExpressRouter = Router();

// Public validate — session optional (for per-customer limit checking if logged in)
couponRouter.post("/validate", optionalSession, validateCouponController);
