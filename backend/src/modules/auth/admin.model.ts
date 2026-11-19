import mongoose, { Schema, model } from "mongoose";

export interface AdminDocument {
  email: string;
  name: string;
  passwordHash: string;
  role: "super_admin" | "admin";
  active: boolean;
  sessionVersion: number;
}

const schema = new Schema<AdminDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin",
    },
    active: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 1 },
  },
  { timestamps: true, versionKey: false }
);

export const AdminModel =
  (mongoose.models.Admin as mongoose.Model<AdminDocument>) ||
  model<AdminDocument>("Admin", schema);
