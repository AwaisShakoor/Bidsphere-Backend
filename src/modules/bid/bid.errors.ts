import { Response } from "express";

export const BidErrors = {
  ITEM_NOT_FOUND: "Item not found",
  AUCTION_NOT_LIVE: "Auction is not open for bidding",
  AUCTION_NOT_STARTED: "Auction has not started yet",
  AUCTION_ENDED: "Auction has ended",
  CANNOT_BID_OWN_ITEM: "You cannot bid on your own item",
  ALREADY_HIGH_BIDDER:
    "You are already the highest bidder. Wait until someone else outbids you",
  INVALID_AMOUNT: "Bid amount must be a positive number",
  BID_TOO_LOW: "Bid must be greater than the current bid",
  BID_BELOW_START: "Bid must be at least the starting price",
} as const;

export function handleBidError(error: unknown, res: Response) {
  const message =
    error instanceof Error ? error.message : "Internal server error";

  if (message === BidErrors.ITEM_NOT_FOUND) {
    return res.status(404).json({ message });
  }

  if (
    message === BidErrors.AUCTION_NOT_LIVE ||
    message === BidErrors.AUCTION_NOT_STARTED ||
    message === BidErrors.AUCTION_ENDED ||
    message === BidErrors.CANNOT_BID_OWN_ITEM ||
    message === BidErrors.ALREADY_HIGH_BIDDER ||
    message === BidErrors.INVALID_AMOUNT ||
    message === BidErrors.BID_TOO_LOW ||
    message === BidErrors.BID_BELOW_START
  ) {
    return res.status(400).json({ message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}
