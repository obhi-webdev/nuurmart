import mongoose from "mongoose";
import { env } from "../config/env.js";
import { CategoryModel } from "../modules/categories/category.model.js";
import { ProductModel } from "../modules/products/product.model.js";

if (!process.argv.includes("--demo")) {
  console.error("Explicit --demo flag required.");
  process.exit(1);
}

if (env.NODE_ENV !== "development") {
  console.error("Demo seeding is allowed in development only.");
  process.exit(1);
}

if (!env.MONGODB_URI) {
  console.error("MONGODB_URI is missing.");
  process.exit(1);
}

const categories = [
  { name: "Honey", slug: "honey" },
  { name: "Dates", slug: "dates" },
  { name: "Oil & Ghee", slug: "oil-and-ghee" },
  { name: "Spices", slug: "spices" },
  { name: "Nuts & Seeds", slug: "nuts-and-seeds" },
  { name: "Organic Foods", slug: "organic-foods" },
];

const demoProducts = [
  {
    name: "Premium Raw Natural Honey",
    slug: "honey-01",
    sku: "DEMO-HON-001",
    categorySlug: "honey",
    price: 1290,
    compareAtPrice: 1490,
    unit: "1 kg",
    image: "honey",
    featured: true,
  },
  {
    name: "Premium Medjool Dates",
    slug: "dates-01",
    sku: "DEMO-DAT-001",
    categorySlug: "dates",
    price: 1850,
    compareAtPrice: 2150,
    unit: "1 kg",
    image: "dates",
    featured: true,
  },
  {
    name: "Cold Pressed Mustard Oil",
    slug: "oil-01",
    sku: "DEMO-OIL-001",
    categorySlug: "oil-and-ghee",
    price: 890,
    compareAtPrice: 990,
    unit: "1 litre",
    image: "oil",
    featured: true,
  },
  {
    name: "Premium Mixed Nuts",
    slug: "nuts-01",
    sku: "DEMO-NUT-001",
    categorySlug: "nuts-and-seeds",
    price: 1450,
    compareAtPrice: 1650,
    unit: "500 g",
    image: "nuts",
    featured: true,
  },
  {
    name: "Organic Turmeric Powder",
    slug: "spice-01",
    sku: "DEMO-SPI-001",
    categorySlug: "spices",
    price: 350,
    unit: "250 g",
    image: "spices",
    featured: false,
  },
  {
    name: "Wholegrain Brown Rice",
    slug: "food-01",
    sku: "DEMO-RIC-001",
    categorySlug: "organic-foods",
    price: 680,
    unit: "2 kg",
    image: "rice",
    featured: false,
  },
  {
    name: "Black Seed Natural Honey",
    slug: "honey-02",
    sku: "DEMO-HON-002",
    categorySlug: "honey",
    price: 1590,
    compareAtPrice: 1750,
    unit: "1 kg",
    image: "honey",
    featured: false,
  },
  {
    name: "Premium Ajwa Dates",
    slug: "dates-02",
    sku: "DEMO-DAT-002",
    categorySlug: "dates",
    price: 2250,
    unit: "1 kg",
    image: "dates",
    featured: false,
  },
];

async function main() {
  await mongoose.connect(env.MONGODB_URI!);

  console.log("Connected to development MongoDB.");

  for (const [index, category] of categories.entries()) {
    await CategoryModel.updateOne(
      { slug: category.slug },
      {
        $setOnInsert: {
          ...category,
          isActive: true,
          sortOrder: index,
          description: "Demo category for development testing",
        },
      },
      { upsert: true }
    );
  }

  for (const item of demoProducts) {
    await ProductModel.updateOne(
      { slug: item.slug },
      {
        $setOnInsert: {
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          categorySlug: item.categorySlug,
          price: item.price,
          compareAtPrice: item.compareAtPrice,
          currency: "BDT",
          unit: item.unit,
          images: [`/images/products/${item.image}.jpg`],
          description: "Development demo product, not a live listing.",
          shortDescription: "Demo catalog item",
          stockQuantity: 0,
          trackInventory: true,
          status: "active",
          featured: item.featured,
          tags: ["demo"],
        },
      },
      { upsert: true }
    );
  }

  const [productCount, categoryCount] = await Promise.all([
    ProductModel.countDocuments({ tags: "demo" }),
    CategoryModel.countDocuments({ isActive: true }),
  ]);

  console.log("Demo products available:", productCount);
  console.log("Active categories available:", categoryCount);
  console.log("Existing records were not overwritten.");
}

main()
  .catch((error: unknown) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
