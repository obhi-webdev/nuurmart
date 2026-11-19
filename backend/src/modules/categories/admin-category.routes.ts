import { Router } from "express";
import { z } from "zod";
import { CategoryModel } from "./category.model.js";
import {
  requireAdmin,
  requireTrustedOrigin
} from "../auth/admin.security.js";

export const adminCategoryRouter = Router();

adminCategoryRouter.use(requireAdmin);

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().min(2).max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).default("")
});

adminCategoryRouter.get("/", async (_req, res, next) => {
  try {
    const data = await CategoryModel.find()
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

adminCategoryRouter.post(
  "/",
  requireTrustedOrigin,
  async (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid category data",
          errors: z.flattenError(parsed.error)
        });
        return;
      }

      const existing = await CategoryModel.exists({
        slug: parsed.data.slug
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: "Category slug already exists"
        });
        return;
      }

      const category = await CategoryModel.create({
        ...parsed.data,
        isActive: true,
        sortOrder: 100
      });

      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }
);
