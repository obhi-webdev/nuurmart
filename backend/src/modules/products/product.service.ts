import type { QueryFilter } from "mongoose";
import {
  ProductModel,
  type ProductDocument,
} from "./product.model.js";

export type ProductListOptions = {
  page: number;
  limit: number;
  category?: string;
  search?: string;
  sort: "newest" | "price_asc" | "price_desc" | "name";
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
};

export async function listProducts(options: ProductListOptions) {
  const filter: QueryFilter<ProductDocument> = { status: "active" };

  if (options.category) {
    filter.categorySlug = options.category;
  }

  if (options.featured !== undefined) {
    filter.featured = options.featured;
  }

  if (options.search) {
    const safeSearch = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = { $regex: safeSearch, $options: "i" };
  }

  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    filter.price = {
      ...(options.minPrice !== undefined
        ? { $gte: options.minPrice }
        : {}),
      ...(options.maxPrice !== undefined
        ? { $lte: options.maxPrice }
        : {}),
    };
  }

  const sortMap = {
    newest: { createdAt: -1, _id: -1 },
    price_asc: { price: 1, _id: 1 },
    price_desc: { price: -1, _id: -1 },
    name: { name: 1, _id: 1 },
  } as const;

  const [data, total] = await Promise.all([
    ProductModel.find(filter)
      .sort(sortMap[options.sort])
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .select("-__v")
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

export async function findPublicProduct(slug: string) {
  return ProductModel.findOne({
    slug,
    status: "active",
  }).lean();
}
