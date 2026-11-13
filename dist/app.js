"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./src/modules/auth/auth.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_1 = __importDefault(require("./src/config/swagger"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const redis_1 = require("./src/config/redis");
const auction_services_1 = require("./src/modules/auction/auction.services");
const auction_router_1 = __importDefault(require("./src/modules/auction/auction.router"));
const categories_router_1 = __importDefault(require("./src/modules/categories/categories.router"));
const items_router_1 = __importDefault(require("./src/modules/items/items.router"));
const admin_route_1 = __importDefault(require("./src/modules/admin/admin.route"));
const bid_router_1 = __importDefault(require("./src/modules/bid/bid.router"));
const payment_webhook_router_1 = __importDefault(require("./src/modules/payment/payment.webhook.router"));
const payment_router_1 = __importDefault(require("./src/modules/payment/payment.router"));
const payment_service_1 = require("./src/modules/payment/payment.service");
const request_logger_middleware_1 = require("./src/middleware/request-logger.middleware");
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 3000);
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
}));
app.use("/api/webhooks/stripe", express_1.default.raw({ type: "application/json" }), payment_webhook_router_1.default);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(request_logger_middleware_1.requestLogger);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    swaggerOptions: {
        docExpansion: "none",
        tryItOutEnabled: true,
        withCredentials: true,
    },
}));
app.use("/api", auth_routes_1.default);
app.use("/api", auction_router_1.default);
app.use("/api", categories_router_1.default);
app.use("/api", items_router_1.default);
app.use("/api/admin", admin_route_1.default);
app.use("/api", bid_router_1.default);
app.use("/api", payment_router_1.default);
app.get("/", (_request, response) => {
    response.json({ message: "Bidsphere API is running" });
});
app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
});
(0, redis_1.connectRedis)().then(() => console.log("Redis connected"));
app.listen(port, () => {
    console.log(`Bidsphere API listening on port ${port}`);
    const runAuctionSync = async () => {
        void (0, auction_services_1.syncAuctionStatuses)().catch((err) => {
            console.log("auction sync failed", err);
        });
    };
    const runpaymentExpiry = async () => {
        void (0, payment_service_1.expireOverduePayments)().catch((err) => {
            console.log("payment expiry failed", err);
        });
    };
    runAuctionSync();
    setInterval(runAuctionSync, 30_000); // Run every 30 seconds
    runpaymentExpiry();
    setInterval(runpaymentExpiry, 300_000); // Run every 5 minutes
});
