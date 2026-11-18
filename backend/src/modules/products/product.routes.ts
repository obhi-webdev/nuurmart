import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
} from "./product.controller.js";

export const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.get("/:slug", getProductBySlug);
