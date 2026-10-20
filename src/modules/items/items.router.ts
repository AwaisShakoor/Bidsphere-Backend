import { Router } from "express";
import { createItemController, deleteItemController, getItemController, getItemsController, updateItemController } from "./items.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { uploadItemImages } from "../../middleware/upload.middleware";

const itemsRouter = Router();

itemsRouter.post("/:auctionId/items", authMiddleware, uploadItemImages, createItemController)
itemsRouter.get("/:auctionId/items", authMiddleware, getItemsController)
itemsRouter.get("/:auctionId/items/:itemId", authMiddleware, getItemController)
itemsRouter.put("/:auctionId/items/:itemId", authMiddleware,uploadItemImages, updateItemController)
itemsRouter.delete("/:auctionId/items/:itemId", authMiddleware, deleteItemController)

export default itemsRouter;