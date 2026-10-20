import { Router } from "express";
import { createAuctionController, deleteAuctionController, getAuctionByIdController, getMyAuctionsController, submitAuctionController, updateAuctionController } from "./auction.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const auctionRouter = Router();

auctionRouter.post("/auctions", authMiddleware, createAuctionController)
auctionRouter.get("/auctions", authMiddleware, getMyAuctionsController)
auctionRouter.get("/auctions/:id", authMiddleware, getAuctionByIdController)
auctionRouter.put("/auctions/:id", authMiddleware, updateAuctionController)
auctionRouter.delete("/auctions/:id", authMiddleware, deleteAuctionController)
auctionRouter.post("/auctions/:id/submit", authMiddleware, submitAuctionController)

export default auctionRouter;
