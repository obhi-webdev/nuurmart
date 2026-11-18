import type { Request, Response, NextFunction } from "express";
import { CategoryModel } from "./category.model.js";

export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await CategoryModel.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}
