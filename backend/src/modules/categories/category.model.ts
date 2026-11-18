import mongoose, { Schema, model } from "mongoose";

export interface CategoryDocument {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ isActive: 1, sortOrder: 1 });

export const CategoryModel =
  (mongoose.models.Category as mongoose.Model<CategoryDocument>) ||
  model<CategoryDocument>("Category", categorySchema);
