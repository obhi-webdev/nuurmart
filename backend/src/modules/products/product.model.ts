import mongoose, { Schema, model } from "mongoose";

export type ProductStatus = "draft" | "active" | "archived";

export interface ProductDocument {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  currency: "BDT";
  unit: string;
  images: string[];
  stockQuantity: number;
  trackInventory: boolean;
  status: ProductStatus;
  featured: boolean;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    categorySlug: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: {
      type: String,
      enum: ["BDT"],
      default: "BDT",
    },
    unit: { type: String, required: true },
    images: { type: [String], default: [] },
    stockQuantity: { type: Number, default: 0, min: 0 },
    trackInventory: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },
    featured: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

productSchema.index({ status: 1, categorySlug: 1, createdAt: -1 });
productSchema.index({ status: 1, price: 1 });

export const ProductModel =
  (mongoose.models.Product as mongoose.Model<ProductDocument>) ||
  model<ProductDocument>("Product", productSchema);
