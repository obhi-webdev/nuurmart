import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  findPublicProduct,
  listProducts,
} from "./product.service.js";

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"])
    .default("newest"),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z.enum(["true", "false"]).transform(
    (value) => value === "true"
  ).optional(),
}).refine(
  (value) =>
    value.minPrice === undefined ||
    value.maxPrice === undefined ||
    value.minPrice <= value.maxPrice,
  { message: "minPrice cannot exceed maxPrice" }
);

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = listSchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product filters",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const result = await listProducts(parsed.data);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const slug = req.params.slug;

    if (
      typeof slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid product slug",
      });
      return;
    }

    const product = await findPublicProduct(slug);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}
