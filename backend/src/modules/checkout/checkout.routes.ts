import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { ProductModel } from "../products/product.model.js";
import { requireTrustedOrigin } from "../auth/admin.security.js";

export const checkoutRouter = Router();

const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many checkout requests. Please try again later."
  }
});

const itemSchema = z.object({
  productId: z.string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  quantity: z.number().int().min(1).max(99)
});

const quoteSchema = z.object({
  items: z.array(itemSchema).min(1).max(30)
}).superRefine((value, ctx) => {
  const ids = value.items.map(item => item.productId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: "custom",
      message: "Duplicate product IDs are not allowed"
    });
  }
});

checkoutRouter.post(
  "/quote",
  requireTrustedOrigin,
  quoteLimiter,
  async (req, res, next) => {
    try {
      const parsed = quoteSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid checkout items"
        });
        return;
      }

      const requested = parsed.data.items;
      const slugs = requested.map(item => item.productId);

      const products = await ProductModel.find({
        slug: { $in: slugs },
        status: "active"
      }).lean();

      const productMap = new Map(
        products.map(product => [product.slug, product])
      );

      const problems: {
        productId: string;
        message: string;
      }[] = [];

      const lines: {
        productId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        availableStock: number | null;
        image: string | null;
      }[] = [];

      for (const item of requested) {
        const product = productMap.get(item.productId);

        if (!product) {
          problems.push({
            productId: item.productId,
            message: "Product is unavailable or unpublished"
          });
          continue;
        }

        if (
          product.trackInventory &&
          product.stockQuantity < item.quantity
        ) {
          problems.push({
            productId: item.productId,
            message: `Only ${product.stockQuantity} available`
          });
          continue;
        }

        lines.push({
          productId: product.slug,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal: Math.round(product.price * item.quantity * 100) / 100,
          availableStock: product.trackInventory
            ? product.stockQuantity
            : null,
          image: product.images?.[0] || null
        });
      }

      const subtotal = Math.round(
        lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100
      ) / 100;

      res.setHeader("Cache-Control", "no-store");

      res.json({
        success: true,
        canCheckout: problems.length === 0,
        currency: "BDT",
        items: lines,
        problems,
        subtotal,
        note: "Quote only. Delivery fees and final stock are checked at order placement."
      });
    } catch (error) {
      next(error);
    }
  }
);
