import express from "express";
import { adminProductRouter } from "./modules/products/admin-product.routes.js";
import { adminCategoryRouter } from "./modules/categories/admin-category.routes.js";
import cookieParser from "cookie-parser";
import { adminRouter } from "./modules/auth/admin.routes.js";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { productRouter } from "./modules/products/product.routes.js";
import { categoryRouter } from "./modules/categories/category.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "nuurmart-api",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/admin/products", adminProductRouter);
app.use("/api/admin/categories", adminCategoryRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});


app.use((
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error("API error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});
