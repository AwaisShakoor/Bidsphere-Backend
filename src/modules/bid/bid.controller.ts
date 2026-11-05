import { Request, Response } from "express";
import { CreateBidDto } from "./create-bid.dto";
import { createBid, getItemBids, getMyBids } from "./bid.service";

export async function createBidController(req: Request, res: Response) {
  try {
    const bidderId = req.user!.userId;
    const itemId = req.params.itemId as string;
    const data = req.body as CreateBidDto;

    const bid = await createBid(itemId, bidderId, data);

    return res.status(201).json({ message: "Bid placed successfully", bid });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getItemBidsController(req: Request, res: Response) {
  try {
    const itemId = req.params.itemId as string;
    const bids = await getItemBids(itemId);
    return res.status(200).json({ bids });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMyBidsController(req: Request, res: Response) {
  try {
    const bidderId = req.user!.userId;
    const bids = await getMyBids(bidderId);
    return res.status(200).json({ bids });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
