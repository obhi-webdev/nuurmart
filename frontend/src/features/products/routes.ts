import { categories, products, type Category } from "./catalog";

export function productUrl(id: string) {
  return `/product/${encodeURIComponent(id)}`;
}

export function categorySlug(category: string) {
  return category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function categoryUrl(category: string) {
  return `/collections/${categorySlug(category)}`;
}

export function findCategory(slug: string): Category | undefined {
  return categories
    .filter((item) => item.name !== "All")
    .find((item) => categorySlug(item.name) === slug)?.name;
}

export function findProduct(slug: string) {
  return products.find((product) => product.id === slug);
}
