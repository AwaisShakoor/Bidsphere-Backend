import { Response } from "express";

export const ItemErrors = {
  AUCTION_NOT_FOUND: "Auction not found",
  ONLY_DRAFT: "Items can only be added to a draft auction",
} as const;

export function handleItemError(error: unknown, res: Response) {
  const message =
    error instanceof Error ? error.message : "Internal server error";

  if (message === ItemErrors.AUCTION_NOT_FOUND) {
    return res.status(404).json({ message });
  }

  if (message === ItemErrors.ONLY_DRAFT) {
    return res.status(400).json({ message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}