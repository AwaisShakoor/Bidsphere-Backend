import { Router } from "express"
import { getCategories } from "./category.controller";

const categoryRouter = Router();

categoryRouter.get("/categories", getCategories);

export default categoryRouter;