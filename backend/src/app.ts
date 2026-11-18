import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "nuurmart-api",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});
