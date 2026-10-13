import { Request, Response } from "express";
import { CreateItemDto } from "./create-item.dto";
import { createItem, getMyItems, updateItem } from "./item.service";
import { updateItemDto } from "./update-item.dto";

export async function createItemHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const data = req.body as CreateItemDto;

    const allowedConditions = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];

    if (!data.title || !data.description || !data.categoryId || !data.itemCondition) {
        return res.status(400).json({ message: "Missing required fields" });
      }

    if (!allowedConditions.includes(data.itemCondition)) {
      return res.status(400).json({ message: "Invalid item condition" });
    }


    const item = await createItem(sellerId, data);

    return res.status(201).json({
      message: "Item created successfully",
      item,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Category not found") {
      return res.status(400).json({ message });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateItemHnadler(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const itemId = req.params.itemId as string;
    const data = req.body as updateItemDto;

    const allowedConditions = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];

    if (!data.title || !data.description || !data.categoryId || !data.itemCondition) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!allowedConditions.includes(data.itemCondition)) {
      return res.status(400).json({ message: "Invalid item condition" });
    }

    const item = await updateItem(sellerId, itemId, data);

    return res.status(200).json({
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyItemsHanlder(req: Request, res: Response) {
    try {
        const sellerId = req.user!.userId;
        const items = await getMyItems(sellerId);

        return res.status(200).json({
            Message: "Items retrieved successfully",
            items,
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default createItemHandler;
