import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import createItemHandler, { getMyItemsHanlder, updateItemHnadler } from "./item.controller";

const itemRouter = Router();

itemRouter.post("/items", authMiddleware, createItemHandler);
itemRouter.get("/items", authMiddleware, getMyItemsHanlder);
itemRouter.put("/items/:itemId", authMiddleware, updateItemHnadler);

export default itemRouter;