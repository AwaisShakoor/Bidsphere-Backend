import { Router } from "express";
import {
  approveAuctionController,
  getAllAuctionsController,
  getAuctionByIdController,
  getOverviewsController,
  getUsersController,
  rejectAuctionController,
} from "./admin.contoller";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";

const adminRouter = Router();

adminRouter.get("/users", authMiddleware, adminMiddleware, getUsersController);
adminRouter.get(
  "/auctions",
  authMiddleware,
  adminMiddleware,
  getAllAuctionsController,
);
adminRouter.get(
  "/auctions/:id",
  authMiddleware,
  adminMiddleware,
  getAuctionByIdController,
);
adminRouter.post(
  "/auctions/:id/approve",
  authMiddleware,
  adminMiddleware,
  approveAuctionController,
);
adminRouter.post(
  "/auctions/:id/reject",
  authMiddleware,
  adminMiddleware,
  rejectAuctionController,
);
adminRouter.get(
  "/overview",
  authMiddleware,
  adminMiddleware,
  getOverviewsController,
);

export default adminRouter;
