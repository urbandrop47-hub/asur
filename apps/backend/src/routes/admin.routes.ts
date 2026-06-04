import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { adminOnlyMiddleware } from "../middlewares/admin-only";
import {
  acceptAdminInviteController,
  createAdminInviteController,
  createAdminProductController,
  deleteAdminProductController,
  getAdminAccessController,
  getAdminOrderController,
  getAdminProductController,
  listAdminInvitesController,
  listAdminOrdersController,
  listAdminProductsController,
  updateAdminProductController
} from "../controllers/admin.controller";
import { listAdminReviewsController, moderateReviewController } from "../controllers/review.controller";
import {
  listInventoryController,
  updateStockController,
  bulkStockUpdateController,
  cancelOrderController
} from "../controllers/inventory.controller";
import {
  listCouponsController,
  createCouponController,
  updateCouponController,
  deleteCouponController
} from "../controllers/coupon.controller";
import {
  getAnalyticsController,
  getRevenueChartController,
  exportOrdersCsvController,
  getSearchAnalyticsController
} from "../controllers/analytics.controller";
import {
  listAdminReturnsController,
  getAdminReturnController,
  adminDecideReturnController
} from "../controllers/return.controller";
import {
  listSizeChartsController,
  upsertSizeChartController,
  deleteSizeChartController
} from "../controllers/size-chart.controller";

export const adminRouter: ExpressRouter = Router();

// Invite management
adminRouter.get("/access-model", adminOnlyMiddleware, getAdminAccessController);
adminRouter.get("/invites", adminOnlyMiddleware, listAdminInvitesController);
adminRouter.post("/invites", adminOnlyMiddleware, createAdminInviteController);
adminRouter.post("/invites/accept", acceptAdminInviteController);

// Product management
adminRouter.get("/products", adminOnlyMiddleware, listAdminProductsController);
adminRouter.post("/products", adminOnlyMiddleware, createAdminProductController);
adminRouter.get("/products/:id", adminOnlyMiddleware, getAdminProductController);
adminRouter.patch("/products/:id", adminOnlyMiddleware, updateAdminProductController);
adminRouter.delete("/products/:id", adminOnlyMiddleware, deleteAdminProductController);

// Order monitoring
adminRouter.get("/orders", adminOnlyMiddleware, listAdminOrdersController);
adminRouter.get("/orders/:id", adminOnlyMiddleware, getAdminOrderController);

// Review moderation
adminRouter.get("/reviews", adminOnlyMiddleware, listAdminReviewsController);
adminRouter.patch("/reviews/:id", adminOnlyMiddleware, moderateReviewController);

// Inventory management
adminRouter.get("/inventory", adminOnlyMiddleware, listInventoryController);
adminRouter.patch("/inventory/stock", adminOnlyMiddleware, updateStockController);
adminRouter.post("/inventory/bulk-stock", adminOnlyMiddleware, bulkStockUpdateController);

// Order cancellation (admin)
adminRouter.post("/orders/:id/cancel", adminOnlyMiddleware, cancelOrderController);

// Analytics
adminRouter.get("/analytics", adminOnlyMiddleware, getAnalyticsController);
adminRouter.get("/analytics/revenue-chart", adminOnlyMiddleware, getRevenueChartController);
adminRouter.get("/analytics/export-csv", adminOnlyMiddleware, exportOrdersCsvController);

// Returns management
adminRouter.get("/returns", adminOnlyMiddleware, listAdminReturnsController);
adminRouter.get("/returns/:id", adminOnlyMiddleware, getAdminReturnController);
adminRouter.patch("/returns/:id", adminOnlyMiddleware, adminDecideReturnController);

// Coupon management
adminRouter.get("/coupons", adminOnlyMiddleware, listCouponsController);
adminRouter.post("/coupons", adminOnlyMiddleware, createCouponController);
adminRouter.patch("/coupons/:code", adminOnlyMiddleware, updateCouponController);
adminRouter.delete("/coupons/:code", adminOnlyMiddleware, deleteCouponController);

// Size chart management
adminRouter.get("/size-guide", adminOnlyMiddleware, listSizeChartsController);
adminRouter.post("/size-guide/:category", adminOnlyMiddleware, upsertSizeChartController);
adminRouter.delete("/size-guide/:category", adminOnlyMiddleware, deleteSizeChartController);
