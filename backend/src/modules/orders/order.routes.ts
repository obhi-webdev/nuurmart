import { Router } from "express";
import mongoose from "mongoose";
import { createHash, randomUUID } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { ProductModel } from "../products/product.model.js";
import { requireTrustedOrigin } from "../auth/admin.security.js";
import { OrderModel } from "./order.model.js";

export const orderRouter = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many order attempts. Please try again later."
  }
});

const itemSchema = z.object({
  productId: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  quantity: z.number().int().min(1).max(99)
});

const checkoutSchema = z.object({
  requestId: z.uuid(),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().regex(/^(?:\+?88)?01[3-9]\d{8}$/),
    district: z.string().trim().min(2).max(100),
    address: z.string().trim().min(10).max(500),
    note: z.string().trim().max(500).default("")
  }),
  deliveryArea: z.enum(["inside_dhaka", "outside_dhaka"]),
  items: z.array(itemSchema).min(1).max(30)
}).refine(
  value => new Set(value.items.map(i => i.productId)).size
    === value.items.length,
  { message: "Duplicate products are not allowed", path: ["items"] }
);

function configuredFee(area: "inside_dhaka" | "outside_dhaka") {
  const key = area === "inside_dhaka"
    ? "COD_DELIVERY_INSIDE_DHAKA"
    : "COD_DELIVERY_OUTSIDE_DHAKA";

  const raw = process.env[key];

  if (raw === undefined || !/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    throw new Error(`Delivery charge not configured: ${key}`);
  }

  const amount = Number(raw);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid delivery charge configuration");
  }

  return amount;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

orderRouter.get("/delivery-fees", (_req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      currency: "BDT",
      data: {
        inside_dhaka: configuredFee("inside_dhaka"),
        outside_dhaka: configuredFee("outside_dhaka")
      }
    });
  } catch {
    res.status(503).json({
      success: false,
      message: "Delivery fees are not configured yet"
    });
  }
});

const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many tracking attempts. Try again later."
  }
});

const trackingSchema = z.object({
  orderNumber: z.string().trim().toUpperCase()
    .min(8).max(80)
    .regex(/^NM-[A-Z0-9-]+$/),
  phone: z.string().trim()
    .regex(/^(?:\+?88)?01[3-9]\d{8}$/)
});

orderRouter.post(
  "/track",
  requireTrustedOrigin,
  trackingLimiter,
  async (req, res, next) => {
    try {
      const parsed = trackingSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Enter a valid order number and phone number"
        });
        return;
      }

      const { orderNumber } = parsed.data;
      const localPhone = parsed.data.phone.replace(
        /^(?:\\+?88)/, ""
      );

      const order = await OrderModel.findOne({
        orderNumber,
        "customer.phone": {
          $in: [
            localPhone,
            "88" + localPhone,
            "+88" + localPhone
          ]
        }
      })
        .select(
          "orderNumber status paymentStatus total currency createdAt"
        )
        .lean();

      res.setHeader("Cache-Control", "no-store");

      if (!order) {
        res.status(404).json({
          success: false,
          message: "Order not found for these details"
        });
        return;
      }

      res.json({
        success: true,
        data: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          currency: order.currency,
          createdAt: (order as unknown as { createdAt: Date }).createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

orderRouter.post(
  "/",
  requireTrustedOrigin,
  checkoutLimiter,
  async (req, res, next) => {
    const parsed = checkoutSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid customer or order data",
        errors: z.flattenError(parsed.error)
      });
      return;
    }

    const input = parsed.data;

    // NUURMART_ORDER_IDEMPOTENCY_V2
    // Hash only validated and normalized request fields.
    const requestHash = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");

    const orderResponse = (order: {
      orderNumber: string;
      subtotal: number;
      deliveryFee: number;
      total: number;
      status: string;
    }) => ({
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      status: order.status
    });

    let deliveryFee: number;

    try {
      deliveryFee = configuredFee(input.deliveryArea);
    } catch {
      res.status(503).json({
        success: false,
        message: "COD delivery charges are not configured yet"
      });
      return;
    }

    // A repeated request must not deduct stock twice.
    const previous = await OrderModel.findOne({
      requestId: input.requestId
    }).lean();

    if (previous) {
      if (previous.requestHash !== requestHash) {
        res.status(409).json({
          success: false,
          message: "Request ID was already used for different order details"
        });
        return;
      }

      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({
        success: true,
        idempotentReplay: true,
        message: "Previous COD order recovered",
        data: orderResponse(previous)
      });
      return;
    }

    const session = await mongoose.startSession();
    let createdOrder: {
      orderNumber: string;
      subtotal: number;
      deliveryFee: number;
      total: number;
      status: string;
    } | null = null;

    try {
      await session.withTransaction(async () => {
        const slugs = input.items.map(item => item.productId);

        const products = await ProductModel.find({
          slug: { $in: slugs },
          status: "active"
        }).session(session);

        const bySlug = new Map(products.map(p => [p.slug, p]));

        if (products.length !== input.items.length) {
          throw new OrderValidationError(
            "One or more products are unavailable"
          );
        }

        const lines = [];
        let subtotal = 0;

        for (const item of input.items) {
          const product = bySlug.get(item.productId);

          if (!product) {
            throw new OrderValidationError(
              `Product unavailable: ${item.productId}`
            );
          }

          if (product.trackInventory) {
            const updated = await ProductModel.findOneAndUpdate(
              {
                _id: product._id,
                status: "active",
                stockQuantity: { $gte: item.quantity }
              },
              { $inc: { stockQuantity: -item.quantity } },
              { new: true, session }
            );

            if (!updated) {
              throw new OrderValidationError(
                `Insufficient stock: ${product.name}`
              );
            }
          }

          const unitPrice = money(product.price);
          const lineTotal = money(unitPrice * item.quantity);
          subtotal = money(subtotal + lineTotal);

          lines.push({
            productId: product.slug,
            name: product.name,
            sku: product.sku,
            image: product.images?.[0] || "",
            quantity: item.quantity,
            unitPrice,
            lineTotal,
            inventoryTracked: product.trackInventory
          });
        }

        const orderNumber =
          "NM-" + Date.now().toString(36).toUpperCase() +
          "-" + randomUUID().slice(0, 8).toUpperCase();

        const [order] = await OrderModel.create([{
          requestId: input.requestId,
          requestHash,
          orderNumber,
          customer: input.customer,
          deliveryArea: input.deliveryArea,
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          status: "pending",
          items: lines,
          subtotal,
          deliveryFee,
          total: money(subtotal + deliveryFee),
          currency: "BDT",
          stockReserved: true
        }], { session });

        if (!order) {
          throw new Error("Order creation returned no document");
        }

        createdOrder = {
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          status: order.status
        };
      }, {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" }
      });

      if (!createdOrder) {
        throw new Error("Order transaction did not complete");
      }

      res.setHeader("Cache-Control", "no-store");
      res.status(201).json({
        success: true,
        idempotentReplay: false,
        message: "COD order placed successfully",
        data: createdOrder
      });
    } catch (error) {
      if (error instanceof OrderValidationError) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      // Concurrent duplicate request: the unique index protects stock.
      // Recover a committed matching order after transaction rollback.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        const existing = await OrderModel.findOne({
          requestId: input.requestId
        }).lean();

        if (existing) {
          if (existing.requestHash !== requestHash) {
            res.status(409).json({
              success: false,
              message: "Request ID was already used for different order details"
            });
            return;
          }

          res.setHeader("Cache-Control", "no-store");
          res.status(200).json({
            success: true,
            idempotentReplay: true,
            message: "Previous COD order recovered",
            data: orderResponse(existing)
          });
          return;
        }

        res.status(409).json({
          success: false,
          message: "Duplicate order constraint conflict"
        });
        return;
      }

      next(error);
    } finally {
      await session.endSession();
    }
  }
);

class OrderValidationError extends Error {}
