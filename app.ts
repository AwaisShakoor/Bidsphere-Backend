import "dotenv/config";
import cors from "cors";
import express from "express";
import authRouter from "./src/modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import swaggerSpec from "./src/config/swagger";
import swaggerUi from "swagger-ui-express";
import { connectRedis } from "./src/config/redis";
import { syncAuctionStatuses } from "./src/modules/auction/auction.services";
import auctionRouter from "./src/modules/auction/auction.router";
import categoriesRouter from "./src/modules/categories/categories.router";
import itemsRouter from "./src/modules/items/items.router";
import adminRouter from "./src/modules/admin/admin.route";
import bidRouter from "./src/modules/bid/bid.router";
import { requestLogger } from "./src/middleware/request-logger.middleware";
import paymentWebhookRouter from "./src/modules/payment/payment.webhook.router";
import paymentRouter from "./src/modules/payment/payment.router";
import { expireOverduePayments } from "./src/modules/payment/payment.service";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  }),
);
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  paymentWebhookRouter,
);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      docExpansion: "none",
      tryItOutEnabled: true,
      withCredentials: true,
    },
  }),
);
app.use("/api", authRouter);
app.use("/api", auctionRouter);
app.use("/api", categoriesRouter);
app.use("/api", itemsRouter);
app.use("/api/admin", adminRouter);
app.use("/api", bidRouter);
app.use("/api", paymentRouter);

app.get("/", (_request, response) => {
  response.json({ message: "Bidsphere API is running" });
});

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

connectRedis().then(() => console.log("Redis connected"));

app.listen(port, () => {
  console.log(`Bidsphere API listening on port ${port}`);

  const runAuctionSync = async () => {
    void syncAuctionStatuses().catch((err) => {
      console.log("auction sync failed", err);
    });
  };

  const runpaymentExpiry = async () => {
    void expireOverduePayments().catch((err) => {
      console.log("payment expiry failed", err);
    });
  };

  runAuctionSync();
  setInterval(runAuctionSync, 30_000); // Run every 30 seconds

  runpaymentExpiry();
  setInterval(runpaymentExpiry, 300_000); // Run every 5 minutes
});
