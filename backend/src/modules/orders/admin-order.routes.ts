import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin, requireTrustedOrigin } from "../auth/admin.security.js";
import { ProductModel } from "../products/product.model.js";
import { OrderModel, type OrderStatus } from "./order.model.js";

export const adminOrderRouter = Router();
adminOrderRouter.use(requireAdmin);

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

adminOrderRouter.get("/", async (_req, res, next) => {
  try {
    const orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

adminOrderRouter.patch(
  "/:id/status",
  requireTrustedOrigin,
  async (req, res, next) => {
    const parsed = z.object({
      status: z.enum([
        "pending",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled"
      ])
    }).safeParse(req.body);

    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !parsed.success
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid order status update"
      });
      return;
    }

    const session = await mongoose.startSession();

    try {
      let updatedOrder: unknown = null;

      await session.withTransaction(async () => {
        const order = await OrderModel.findById(
          req.params.id
        ).session(session);

        if (!order) {
          throw new Error("ORDER_NOT_FOUND");
        }

        const nextStatus = parsed.data.status;

        if (!transitions[order.status].includes(nextStatus)) {
          throw new Error("INVALID_TRANSITION");
        }

        if (nextStatus === "cancelled" && order.stockReserved) {
          for (const item of order.items) {
            if (!item.inventoryTracked) continue;

            await ProductModel.updateOne(
              { slug: item.productId },
              { $inc: { stockQuantity: item.quantity } },
              { session }
            );
          }

          order.stockReserved = false;
        }

        order.status = nextStatus;
        await order.save({ session });

        updatedOrder = order.toObject();
      });

      res.setHeader("Cache-Control", "no-store");
      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "ORDER_NOT_FOUND") {
          res.status(404).json({
            success: false,
            message: "Order not found"
          });
          return;
        }

        if (error.message === "INVALID_TRANSITION") {
          res.status(409).json({
            success: false,
            message: "Order status transition is not permitted"
          });
          return;
        }
      }

      next(error);
    } finally {
      await session.endSession();
    }
  }
);
