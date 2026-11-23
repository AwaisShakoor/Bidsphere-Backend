import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  confirmCheckoutController,
  createCheckoutController,
  createConnectOnboardingLinkController,
  createConnectWithdrawController,
  getConnectBalanceController,
  getConnectionStatusController,
  getItemPaymentController,
  getMyPaymentsController,
  getMyPayoutsController,
  markAsDeliveredController,
  markAsShippedController,
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

paymentRouter.post(
  "/me/stripe/connect",
  authMiddleware,
  createConnectOnboardingLinkController,
);
paymentRouter.get(
  "/me/stripe/status",
  authMiddleware,
  getConnectionStatusController,
);
paymentRouter.get("/me/payouts", authMiddleware, getMyPayoutsController);
paymentRouter.get(
  "/me/stripe/balance",
  authMiddleware,
  getConnectBalanceController,
);
paymentRouter.post(
  "/me/stripe/withdraw",
  authMiddleware,
  createConnectWithdrawController,
);
paymentRouter.post(
  "/payments/items/:itemId/confirm",
  authMiddleware,
  confirmCheckoutController,
);
paymentRouter.post(
  "/payments/items/:itemId/ship",
  authMiddleware,
  markAsShippedController,
);
paymentRouter.post(
  "/payments/items/:itemId/deliver",
  authMiddleware,
  markAsDeliveredController,
);

export default paymentRouter;
