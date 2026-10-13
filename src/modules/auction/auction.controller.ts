import { Request, Response } from "express";
import { createAuctionDto } from "./create-auction.dto";
import {
  createAuction,
  deleteAuction,
  getAuctionById,
  getAuctions,
  getMyAuctions,
  updateAuction,
} from "./auction.service";
import { UpdateAuctionDto } from "./update-auction-dto";

export async function createAuctionHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const data = req.body as createAuctionDto;

    if (
      !data.itemId ||
      !data.startingPrice ||
      !data.shippingType ||
      !data.startTime ||
      !data.endTime
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const auction = await createAuction(sellerId, data);

    return res.status(201).json({
      message: "Auction created successfully",
      auction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (
      message === "Item not found" ||
      message === "You are not the owner of this item" ||
      message === "Start time must be before end time"
    ) {
      return res.status(400).json({ message });
    }
  }
}

export async function updateAuctionHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const auctionId = req.params.id as string;
    const data = req.body as UpdateAuctionDto;

    const auction = await updateAuction(sellerId, auctionId, data);

    return res.status(200).json({
      message: "Auction updated successfully",
      auction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Auction not found") {
      return res.status(404).json({ message });
    }

    if (
      message === "You are not the owner of this item" ||
      message === "Only DRAFT auctions can be updated" ||
      message === "shippingCost is required for FLAT_RATE" ||
      message === "Start time must be before end time"
    ) {
      return res.status(400).json({ message });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAuctionHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const auctionId = req.params.id as string;
    const auction = await deleteAuction(sellerId, auctionId);

    return res.status(200).json({
      message: "Auction deleted successfully",
      auction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (
      message === "Auction not found" ||
      message === "You are not the owner of this item"
    ) {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyAuctionsHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const categoryId = req.query.categoryId as string;
    const auctions = await getMyAuctions(sellerId, categoryId);

    return res.status(200).json({
      message: "Auctions retrieved successfully",
      auctions,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAuctionsHanlder(req: Request, res: Response) {
  try {
    const categoryId = req.query.categoryId as string;
    const auctions = await getAuctions(categoryId);
    return res.status(200).json({
      message: "Auctions retrieved successfully",
      auctions,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAuctionByIdHanlder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const auction = await getAuctionById(id);

    return res.status(200).json({
      message: "Auction retrieved successfully",
      auction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Auction not found") {
      return res.status(404).json({ message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}
