import { Request, Response } from "express";
import { getCategories, getCategoryBySlug } from "./categories.service";

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

export async function getCategoryBySlugController(req: Request, res: Response) {
  try {
    const slug = req.params.slug;
    const category = await getCategoryBySlug(slug as string);
    res.status(200).json({
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}