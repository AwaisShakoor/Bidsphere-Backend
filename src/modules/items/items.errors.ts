import { Response } from "express";

export const ItemErrors = {
  AUCTION_NOT_FOUND: "Auction not found",
  ONLY_DRAFT: "Items can only be added to a draft or rejected auction",
  IMAGE_UPLOAD_FAILED: "Image upload failed",
  IMAGE_UPLOAD_TIMEOUT:
    "Image upload timed out. Check Cloudinary credentials and network, then try a smaller image",
  CLOUDINARY_NOT_CONFIGURED:
    "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET",
} as const;

export function handleItemError(error: unknown, res: Response) {
  const message =
    error instanceof Error ? error.message : "Internal server error";

  if (message === ItemErrors.AUCTION_NOT_FOUND) {
    return res.status(404).json({ message });
  }

  if (
    message === ItemErrors.ONLY_DRAFT ||
    message === ItemErrors.IMAGE_UPLOAD_FAILED ||
    message === ItemErrors.IMAGE_UPLOAD_TIMEOUT ||
    message === ItemErrors.CLOUDINARY_NOT_CONFIGURED ||
    message.toLowerCase().includes("image upload") ||
    message.toLowerCase().includes("cloudinary")
  ) {
    return res.status(400).json({ message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}
