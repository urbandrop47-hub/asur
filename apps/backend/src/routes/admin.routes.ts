import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { adminOnlyMiddleware } from "../middlewares/admin-only";
import { requirePermission } from "../middlewares/require-permission";
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
  updateAdminProductController,
  bulkProductActionController
} from "../controllers/admin.controller";
import { bulkOrderStatusController } from "../controllers/order.controller";
import { listAuditLogsController } from "../controllers/audit-log.controller";
import { downloadInvoiceController } from "../controllers/invoice.controller";
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
  getSearchAnalyticsController,
  orderStreamController
} from "../controllers/analytics.controller";
import { getVendorPerformanceController } from "../controllers/vendor.controller";
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
import {
  getAdminConfigController,
  updateAdminConfigController
} from "../controllers/site-config.controller";
import {
  listAdminGiftCardsController,
  adminCreateGiftCardController,
  adminUpdateGiftCardController,
  adminAdjustBalanceController,
  adminResendEmailController
} from "../controllers/gift-card.controller";
import { adminListSubscribers, adminNewsletterStats } from "../controllers/newsletter.controller";
import {
  adminListArticlesController,
  adminGetArticleController,
  adminCreateArticleController,
  adminUpdateArticleController,
  adminDeleteArticleController,
} from "../controllers/article.controller";
import {
  listCustomersController,
  getCustomerProfileController,
  addCustomerNoteController,
  emailSegmentController
} from "../controllers/customer.controller";

export const adminRouter: ExpressRouter = Router();

// Invite management
adminRouter.get("/access-model", adminOnlyMiddleware, getAdminAccessController);
adminRouter.get("/invites", adminOnlyMiddleware, listAdminInvitesController);
adminRouter.post("/invites", adminOnlyMiddleware, requirePermission("users:invite"), createAdminInviteController);
adminRouter.post("/invites/accept", acceptAdminInviteController);

// Product management
adminRouter.get("/products", adminOnlyMiddleware, listAdminProductsController);
adminRouter.post("/products", adminOnlyMiddleware, requirePermission("catalog:write"), createAdminProductController);
adminRouter.patch("/products/bulk", adminOnlyMiddleware, requirePermission("catalog:write"), bulkProductActionController);
adminRouter.get("/products/:id", adminOnlyMiddleware, getAdminProductController);
adminRouter.patch("/products/:id", adminOnlyMiddleware, requirePermission("catalog:write"), updateAdminProductController);
adminRouter.delete("/products/:id", adminOnlyMiddleware, requirePermission("catalog:write"), deleteAdminProductController);

// Order monitoring
adminRouter.get("/orders", adminOnlyMiddleware, listAdminOrdersController);
adminRouter.post("/orders/bulk-status", adminOnlyMiddleware, requirePermission("fulfillment:write"), bulkOrderStatusController);
// /orders/stream must be before /:id to avoid param swallowing
adminRouter.get("/orders/stream", adminOnlyMiddleware, orderStreamController);
adminRouter.get("/orders/:id", adminOnlyMiddleware, getAdminOrderController);
adminRouter.get("/orders/:id/invoice", adminOnlyMiddleware, downloadInvoiceController);

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
adminRouter.get("/analytics/search", adminOnlyMiddleware, getSearchAnalyticsController);

// Returns management
adminRouter.get("/returns", adminOnlyMiddleware, listAdminReturnsController);
adminRouter.get("/returns/:id", adminOnlyMiddleware, getAdminReturnController);
adminRouter.patch("/returns/:id", adminOnlyMiddleware, adminDecideReturnController);

// Coupon management
adminRouter.get("/coupons", adminOnlyMiddleware, listCouponsController);
adminRouter.post("/coupons", adminOnlyMiddleware, createCouponController);
adminRouter.patch("/coupons/:code", adminOnlyMiddleware, updateCouponController);
adminRouter.delete("/coupons/:code", adminOnlyMiddleware, deleteCouponController);

// Site config
adminRouter.get("/config", adminOnlyMiddleware, getAdminConfigController);
adminRouter.patch("/config", adminOnlyMiddleware, requirePermission("settings:write"), updateAdminConfigController);

// Gift card management
adminRouter.get("/gift-cards", adminOnlyMiddleware, listAdminGiftCardsController);
adminRouter.post("/gift-cards", adminOnlyMiddleware, adminCreateGiftCardController);
adminRouter.patch("/gift-cards/:id", adminOnlyMiddleware, adminUpdateGiftCardController);
adminRouter.post("/gift-cards/:id/adjust-balance", adminOnlyMiddleware, adminAdjustBalanceController);
adminRouter.post("/gift-cards/:id/resend-email", adminOnlyMiddleware, adminResendEmailController);

// Size chart management
adminRouter.get("/size-guide", adminOnlyMiddleware, listSizeChartsController);
adminRouter.post("/size-guide/:category", adminOnlyMiddleware, upsertSizeChartController);
adminRouter.delete("/size-guide/:category", adminOnlyMiddleware, deleteSizeChartController);

// Newsletter management
adminRouter.get("/newsletter/subscribers", adminOnlyMiddleware, adminListSubscribers);
adminRouter.get("/newsletter/stats", adminOnlyMiddleware, adminNewsletterStats);

// Editorial / Articles management
adminRouter.get("/articles", adminOnlyMiddleware, adminListArticlesController);
adminRouter.post("/articles", adminOnlyMiddleware, requirePermission("content:write"), adminCreateArticleController);
adminRouter.get("/articles/:id", adminOnlyMiddleware, adminGetArticleController);
adminRouter.patch("/articles/:id", adminOnlyMiddleware, requirePermission("content:write"), adminUpdateArticleController);
adminRouter.delete("/articles/:id", adminOnlyMiddleware, requirePermission("content:write"), adminDeleteArticleController);

// Customer CRM
adminRouter.get("/customers", adminOnlyMiddleware, listCustomersController);
// email-segment must be before /:id to avoid param swallowing
adminRouter.post("/customers/email-segment", adminOnlyMiddleware, requirePermission("users:invite"), emailSegmentController);
adminRouter.get("/customers/:id", adminOnlyMiddleware, getCustomerProfileController);
adminRouter.post("/customers/:id/note", adminOnlyMiddleware, addCustomerNoteController);

// Audit log
adminRouter.get("/audit-log", adminOnlyMiddleware, listAuditLogsController);

// Vendor performance report
adminRouter.get("/vendor-performance", adminOnlyMiddleware, getVendorPerformanceController);
