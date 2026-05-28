import { Router } from "express";
import { API_BASE_PATH } from "@asur/constants";
import { authRouter } from "./auth.routes";
import { ordersRouter } from "./orders.routes";
import { paymentsRouter } from "./payments.routes";
import { productsRouter } from "./products.routes";

export const apiRouter: Router = Router();

apiRouter.use(`${API_BASE_PATH}/auth`, authRouter);
apiRouter.use(`${API_BASE_PATH}/products`, productsRouter);
apiRouter.use(`${API_BASE_PATH}/orders`, ordersRouter);
apiRouter.use(`${API_BASE_PATH}/payments`, paymentsRouter);
