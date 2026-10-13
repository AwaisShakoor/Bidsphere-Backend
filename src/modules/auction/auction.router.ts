import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createAuctionHandler, getAuctionByIdHanlder, getAuctionsHanlder, getMyAuctionsHandler, updateAuctionHandler, deleteAuctionHandler } from "./auction.controller";

const auctionRouter = Router();

auctionRouter.post("/auctions", authMiddleware, createAuctionHandler);
auctionRouter.put("/auctions/:id", authMiddleware, updateAuctionHandler);
auctionRouter.delete("/auctions/:id", authMiddleware, deleteAuctionHandler);
auctionRouter.get("/my-auctions", authMiddleware, getMyAuctionsHandler);
auctionRouter.get("/auctions", getAuctionsHanlder);
auctionRouter.get("/auctions/:id", getAuctionByIdHanlder);


export default auctionRouter;