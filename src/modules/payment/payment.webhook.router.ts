import { Router } from "express";
import { stripeWebhookController } from "./payment.webhook.controller";

const paymentWebhookRouter = Router();

paymentWebhookRouter.post("/", stripeWebhookController);

export default paymentWebhookRouter;
