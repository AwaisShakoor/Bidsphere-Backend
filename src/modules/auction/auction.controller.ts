import { Request, Response } from "express";
import { handleAuctionError } from "./auction.errors";
import { CreateAuctionDto } from "./create-auction.dto";
import {
  createAuction,
  deleteAuction,
  getAuctionById,
  getMyAuctions,
  submitAuction,
  updateAuction,
} from "./auction.services";
import { UpdateAuctionDto } from "./update-auction.dto";

export async function createAuctionController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const data = req.body as CreateAuctionDto;

    const auction = await createAuction(sellerId, data);

    return res.status(201).json({
      message: "Auction created successfully",
      auction,
    });
  } catch (error) {
    return handleAuctionError(error, res);
  }
}

export async function getMyAuctionsController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const auctions = await getMyAuctions(sellerId);

    return res.status(200).json({
      message: "Auctions retrieved successfully",
      auctions,
    });
  } catch (error) {
    return handleAuctionError(error, res);
  }
}

export async function getAuctionByIdController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const auctionId = req.params.id;

    const auction = await getAuctionById(sellerId, auctionId as string);

    return res.status(200).json({
      message: "Auction retrieved successfully",
      auction,
    });
  } catch (error) {
    return handleAuctionError(error, res);
  }
}

export async function updateAuctionController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const auctionId = req.params.id;
    const updateAuctionDto = req.body as UpdateAuctionDto;

    const auction = await updateAuction(
      sellerId,
      auctionId as string,
      updateAuctionDto,
    );

    return res.status(200).json({
      message: "Auction updated successfully",
      auction,
    });
  } catch (error) {
    return handleAuctionError(error, res);
  }
}

export async function deleteAuctionController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const auctionId = req.params.id;

    const auction = await deleteAuction(sellerId, auctionId as string);

    return res.status(200).json({
      message: "Auction deleted successfully",
      auction,
    });
  } catch (error) {
    return handleAuctionError(error, res);
  }
}

export async function submitAuctionController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const auctionId = req.params.id;

    const auction = await submitAuction(sellerId, auctionId as string);

    return res.status(200).json({
      message: "Auction submitted successfully",
      auction,
    });
  } catch (error) {
    return handleAuctionError(error, res);
  }
}