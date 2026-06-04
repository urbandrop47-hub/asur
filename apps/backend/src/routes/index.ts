import { Router } from "express";
import { API_BASE_PATH } from "@asur/constants";
import { adminRouter } from "./admin.routes";
import { authRouter } from "./auth.routes";
import { ordersRouter } from "./orders.routes";
import { paymentsRouter } from "./payments.routes";
import { productsRouter } from "./products.routes";
import { reviewsRouter } from "./reviews.routes";
import { vendorRouter } from "./vendor.routes";
import { wishlistRouter } from "./wishlist.routes";
import { stockAlertsRouter } from "./stock-alerts.routes";
import { couponRouter } from "./coupon.routes";
import { sizeChartRouter } from "./size-chart.routes";

export const apiRouter: Router = Router();

apiRouter.use(`${API_BASE_PATH}/auth`, authRouter);
apiRouter.use(`${API_BASE_PATH}/admin`, adminRouter);
apiRouter.use(`${API_BASE_PATH}/products`, productsRouter);
apiRouter.use(`${API_BASE_PATH}/orders`, ordersRouter);
apiRouter.use(`${API_BASE_PATH}/payments`, paymentsRouter);
apiRouter.use(`${API_BASE_PATH}/reviews`, reviewsRouter);
apiRouter.use(`${API_BASE_PATH}/vendor`, vendorRouter);
apiRouter.use(`${API_BASE_PATH}/wishlist`, wishlistRouter);
apiRouter.use(`${API_BASE_PATH}/stock-alerts`, stockAlertsRouter);
apiRouter.use(`${API_BASE_PATH}/coupons`, couponRouter);
apiRouter.use(`${API_BASE_PATH}/size-guide`, sizeChartRouter);
