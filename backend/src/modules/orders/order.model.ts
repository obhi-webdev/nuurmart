import mongoose, { Schema, model } from "mongoose";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderDocument {
  requestId: string;
  requestHash?: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    district: string;
    address: string;
    note: string;
  };
  deliveryArea: "inside_dhaka" | "outside_dhaka";
  paymentMethod: "cod";
  paymentStatus: "unpaid" | "paid";
  status: OrderStatus;
  items: {
    productId: string;
    name: string;
    sku: string;
    image: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    inventoryTracked: boolean;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: "BDT";
  stockReserved: boolean;
}

const orderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  sku: { type: String, default: "" },
  image: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
  inventoryTracked: { type: Boolean, required: true }
}, { _id: false });

const orderSchema = new Schema<OrderDocument>({
  requestId: { type: String, required: true, unique: true },
  requestHash: { type: String, select: true },
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    note: { type: String, default: "" }
  },
  deliveryArea: {
    type: String,
    enum: ["inside_dhaka", "outside_dhaka"],
    required: true
  },
  paymentMethod: { type: String, enum: ["cod"], default: "cod" },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid"
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ["BDT"], default: "BDT" },
  stockReserved: { type: Boolean, default: true }
}, { timestamps: true });

orderSchema.index({ createdAt: -1, status: 1 });

export const OrderModel =
  (mongoose.models.Order as mongoose.Model<OrderDocument>) ||
  model<OrderDocument>("Order", orderSchema);
