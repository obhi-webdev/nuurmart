import { Router } from "express";
import { getCategories } from "./category.controller.js";

export const categoryRouter = Router();

categoryRouter.get("/", getCategories);
