import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  createCheckoutController,
  getItemPaymentController,
  getMyPaymentsController,
} from "./payment.controller";

const paymentRouter = Router();

paymentRouter.post(
  "/payments/items/:itemId/checkout",
  authMiddleware,
  createCheckoutController,
);
paymentRouter.get(
  "/payments/items/:itemId",
  authMiddleware,
  getItemPaymentController,
);
paymentRouter.get("/me/payments", authMiddleware, getMyPaymentsController);

export default paymentRouter;
