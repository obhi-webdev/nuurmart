import "dotenv/config";
import mongoose from "mongoose";
import { ProductModel } from "../modules/products/product.model.js";
import { env } from "../config/env.js";

const DATABASE = "nuurmart_cod_test";
const SLUG = "nuurmart-browser-cod-test";

async function main() {
  if (env.NODE_ENV !== "development") {
    throw new Error("STOP: Development environment required");
  }

  const mongoUri = env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI");
  }

  await mongoose.connect(mongoUri);

  const actualDatabase = mongoose.connection.db?.databaseName;

  if (actualDatabase !== DATABASE) {
    throw new Error(
      `STOP: Wrong database: ${actualDatabase}`
    );
  }

  console.log("Database isolation: VERIFIED");

  const existing = await ProductModel.findOne({ slug: SLUG });

  if (existing) {
    console.log("Test Product already exists.");
    console.log("SKU:", existing.sku);
    console.log("Current Stock:", existing.stockQuantity);
    console.log("Price:", existing.price);
    return;
  }

  const product = await ProductModel.create({
    name: "NuurMart Browser COD Test",
    slug: SLUG,
    sku: "NM-BROWSER-COD-TEST",
    categorySlug: "honey",
    description:
      "Temporary product for isolated checkout testing.",
    shortDescription: "Browser checkout verification",
    price: 100,
    currency: "BDT",
    unit: "1 pc",
    images: [],
    stockQuantity: 10,
    trackInventory: true,
    status: "active",
    featured: true
  });

  console.log("Test Product Created: PASS");
  console.log("Product ID:", product.slug);
  console.log("Price: BDT", product.price);
  console.log("Initial Stock:", product.stockQuantity);
}

main()
  .catch(error => {
    console.error("SEED FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
