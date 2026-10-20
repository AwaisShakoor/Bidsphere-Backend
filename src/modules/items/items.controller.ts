import { Request, Response } from "express";
import { CreateItemsDto } from "./create-items.dto";
import {
  createItem,
  deletItem,
  getItem,
  getItems,
  updateItem,
} from "./items.service";
import { handleItemError } from "./items.errors";
import { UpdateItemsDto } from "./update-items.dto";

export async function createItemController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const auctionId = req.params.auctionId;
    const data = req.body as CreateItemsDto;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const item = await createItem(auctionId as string, sellerId, data, files);
    return res.status(201).json({
      message: "Item created successfully",
      item,
    });
  } catch (error) {
    return handleItemError(error, res);
  }
}

export async function getItemsController(req: Request, res: Response) {
  try {
    const auctionId = req.params.auctionId;
    const items = await getItems(auctionId as string);
    return res.status(200).json({
      message: "Items fetched successfully",
      items,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getItemController(req: Request, res: Response) {
  try {
    const itemId = req.params.itemId;
    const item = await getItem(itemId as string);
    return res.status(200).json({
      message: "Item fetched successfully",
      item,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateItemController(req: Request, res: Response) {
  try {
    const itemId = req.params.itemId;
    const data = req.body as UpdateItemsDto;
    const files = req.files as Express.Multer.File[];

    const item = await updateItem(itemId as string, data, files);
    return res.status(200).json({
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    return handleItemError(error, res);
  }
}

export async function deleteItemController(req: Request, res: Response) {
  try {
    const itemId = req.params.itemId;
    const item = await deletItem(itemId as string);
    return res.status(200).json({
      message: "Item deleted successfully",
      item,
    });
  } catch (error) {
    return handleItemError(error, res);
  }
}
