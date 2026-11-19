import { Router } from "express";
import { z } from "zod";
import { ProductModel } from "./product.model.js";
import { CategoryModel } from "../categories/category.model.js";
import {
  requireAdmin,
  requireTrustedOrigin
} from "../auth/admin.security.js";

export const adminProductRouter = Router();

adminProductRouter.use(requireAdmin);

const slug = z.string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const productSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug,
  sku: z.string().trim().min(2).max(80)
    .regex(/^[a-zA-Z0-9_-]+$/),
  categorySlug: slug,
  price: z.number().finite().min(0),
  compareAtPrice: z.number().finite().min(0).nullable(),
  unit: z.string().trim().min(1).max(50),
  stockQuantity: z.number().int().min(0),
  shortDescription: z.string().max(500),
  description: z.string().max(10000),
  images: z.array(
    z.string().regex(/^\/(?:images\/[a-zA-Z0-9/_-]+\.(?:jpg|jpeg|png|webp)|uploads\/products\/[a-f0-9-]{36}\.webp)$/)
  ).max(12),
  featured: z.boolean(),
  status: z.enum(["draft", "active", "archived"])
}).refine(
  (p) => p.compareAtPrice === null || p.compareAtPrice >= p.price,
  { message: "Compare-at price must be at least the selling price" }
);

async function validCategory(categorySlug: string) {
  return CategoryModel.exists({ slug: categorySlug, isActive: true });
}

function dbError(error: unknown, res: any, next: any) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "Product SKU or slug already exists"
    });
    return;
  }
  next(error);
}

adminProductRouter.get("/", async (_req, res, next) => {
  try {
    const data = await ProductModel.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

adminProductRouter.post(
  "/",
  requireTrustedOrigin,
  async (req, res, next) => {
    try {
      const parsed = productSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid product data",
          errors: z.flattenError(parsed.error)
        });
        return;
      }

      if (!await validCategory(parsed.data.categorySlug)) {
        res.status(400).json({
          success: false,
          message: "Select an active category"
        });
        return;
      }

      const { compareAtPrice, ...data } = parsed.data;

      const product = await ProductModel.create({
        ...data,
        ...(compareAtPrice !== null ? { compareAtPrice } : {}),
        currency: "BDT",
        trackInventory: true
      });

      res.status(201).json({ success: true, data: product });
    } catch (error) {
      dbError(error, res, next);
    }
  }
);

adminProductRouter.patch(
  "/:id",
  requireTrustedOrigin,
  async (req, res, next) => {
    try {
      if (!/^[a-f0-9]{24}$/i.test(req.params.id as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid product ID"
        });
        return;
      }

      const parsed = productSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid product data",
          errors: z.flattenError(parsed.error)
        });
        return;
      }

      if (!await validCategory(parsed.data.categorySlug)) {
        res.status(400).json({
          success: false,
          message: "Select an active category"
        });
        return;
      }

      const { compareAtPrice, ...data } = parsed.data;

      const update = {
        $set: {
          ...data,
          ...(compareAtPrice !== null ? { compareAtPrice } : {})
        },
        ...(compareAtPrice === null
          ? { $unset: { compareAtPrice: 1 } }
          : {})
      };

      const product = await ProductModel.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true, runValidators: true }
      );

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found"
        });
        return;
      }

      res.json({ success: true, data: product });
    } catch (error) {
      dbError(error, res, next);
    }
  }
);
