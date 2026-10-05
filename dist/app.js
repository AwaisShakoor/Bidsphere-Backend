"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 3000);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (_request, response) => {
    response.json({ message: 'Bidsphere API is running' });
});
app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
});
app.listen(port, () => {
    console.log(`Bidsphere API listening on port ${port}`);
});
