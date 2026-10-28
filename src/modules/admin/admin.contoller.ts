import { Request, Response } from "express";
import {
  approveAuction,
  getAllAuctions,
  getAuctionById,
  getOverviews,
  getUsers,
  rejectAuction,
} from "./admin.service";

export async function getUsersController(req: Request, res: Response) {
  try {
    const users = await getUsers();
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllAuctionsController(req: Request, res: Response) {
  try {
    const auctions = await getAllAuctions();
    res.status(200).json({
      success: true,
      message: "Auctions retrieved successfully",
      data: auctions,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAuctionByIdController(req: Request, res: Response) {
  try {
    const auctionId = req.params.id as string;
    const auction = await getAuctionById(auctionId);
    res.status(200).json({
      success: true,
      message: "Auction retrieved successfully",
      data: auction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Auction not found") {
      return res.status(404).json({ message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function approveAuctionController(req: Request, res: Response) {
  try {
    const auctionId = req.params.id as string;
    const auction = await approveAuction(auctionId);
    res.status(200).json({
      success: true,
      message: "Auction approved successfully",
      data: auction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Auction not found") {
      return res.status(404).json({ message });
    }
    if (message === "Auction is not pending approval") {
      return res.status(400).json({ message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectAuctionController(req: Request, res: Response) {
  try {
    const auctionId = req.params.id as string;
    const rejectionReason = req.body.rejectionReason as string;
    const auction = await rejectAuction(auctionId, rejectionReason);
    res.status(200).json({
      success: true,
      message: "Auction rejected successfully",
      data: auction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Auction not found") {
      return res.status(404).json({ message });
    }
    if (message === "Auction is not pending approval") {
      return res.status(400).json({ message });
    }
    if (message === "Rejection reason is required") {
      return res.status(400).json({ message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOverviewsController(req: Request, res: Response) {
  try {
    const overviews = await getOverviews();
    res.status(200).json({
      success: true,
      message: "Overviews retrieved successfully",
      data: overviews,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Overviews not found") {
      return res.status(404).json({ message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
