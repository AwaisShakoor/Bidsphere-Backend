import { Router } from "express";
import { getCategoriesController } from "./categories.controller";

const categoriesRouter = Router();

categoriesRouter.get("/categories", getCategoriesController);

export default categoriesRouter;