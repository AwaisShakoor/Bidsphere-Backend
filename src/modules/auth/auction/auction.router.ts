import { Router } from "express";
import { createAuctionController, deleteAuctionController, getAuctionByIdController, getMyAuctionsController, updateAuctionController } from "./auction.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const auctionRouter = Router();

auctionRouter.post("/auctions", authMiddleware, createAuctionController)
auctionRouter.get("/auctions/me", authMiddleware, getMyAuctionsController)
auctionRouter.get("/auctions/:id", authMiddleware, getAuctionByIdController)
auctionRouter.put("/auctions/:id", authMiddleware, updateAuctionController)
auctionRouter.delete("/auctions/:id", authMiddleware, deleteAuctionController)

export default auctionRouter;
