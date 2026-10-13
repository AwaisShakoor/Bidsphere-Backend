import { Request, Response } from "express";
import { getCategory } from "./category.service";

export async function getCategories(req:Request, res:Response) {
    try {
        const categories = await getCategory();
        return res.status(200).json({
            message: "Categories retrieved successfully",
            categories
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        })
    }
}