import { Response } from "express";

export const AuctionErrors = {
  NOT_FOUND: "Auction not found",
  INVALID_TIMES: "Invalid start or end time",
  END_BEFORE_START: "Start time must be before end time",
  ONLY_DRAFT_UPDATE: "Only draft auctions can be updated",
  ONLY_DRAFT_DELETE: "Only draft auctions can be deleted",
  ONLY_DRAFT_SUBMIT: "Only draft or rejected auctions can be submitted",
} as const;

export function handleAuctionError(error: unknown, res: Response) {
  const message =
    error instanceof Error ? error.message : "Internal server error";

  if (message === AuctionErrors.NOT_FOUND) {
    return res.status(404).json({ message });
  }

  if (
    message === AuctionErrors.INVALID_TIMES ||
    message === AuctionErrors.END_BEFORE_START ||
    message === AuctionErrors.ONLY_DRAFT_UPDATE ||
    message === AuctionErrors.ONLY_DRAFT_DELETE ||
    message === AuctionErrors.ONLY_DRAFT_SUBMIT
  ) {
    return res.status(400).json({ message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}
