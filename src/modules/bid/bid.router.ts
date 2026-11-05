import { Router } from "express";
import {
  createBidController,
  getItemBidsController,
  getMyBidsController,
} from "./bid.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const bidRouter = Router();

bidRouter.post("/items/:itemId/bids", authMiddleware, createBidController);
bidRouter.get("/items/:itemId/bids", getItemBidsController);
bidRouter.get("/me/bids", authMiddleware, getMyBidsController);

export default bidRouter;
