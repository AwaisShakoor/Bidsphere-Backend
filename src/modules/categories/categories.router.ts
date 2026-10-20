import { Router } from "express";
import { getCategoriesController, getCategoryBySlugController } from "./categories.controller";

const categoriesRouter = Router();

categoriesRouter.get("/categories", getCategoriesController);
categoriesRouter.get("/category/:slug/items", getCategoryBySlugController);

export default categoriesRouter;