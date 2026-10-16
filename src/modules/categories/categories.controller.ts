import { Request, Response } from "express";
import { getCategories } from "./categories.service";

export async function getCategoriesController(req: Request, res: Response) {
  try {
    const categories = await getCategories();
    res.status(200).json({
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
