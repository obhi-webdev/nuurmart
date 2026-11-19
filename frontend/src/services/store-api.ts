import type { Product, Category } from "@/features/products/catalog";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

type ApiProduct = {
  _id: string;
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  unit: string;
  images: string[];
  stockQuantity: number;
  featured: boolean;
  status: string;
};

type ApiCategory = {
  name: string;
  slug: string;
  description?: string;
  image?: string;
};

type ProductsResponse = {
  success: boolean;
  data: ApiProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CategoriesResponse = {
  success: boolean;
  data: ApiCategory[];
};

function categoryName(slug: string): string {
  const names: Record<string, string> = {
    honey: "Honey",
    dates: "Dates",
    "oil-and-ghee": "Oil & Ghee",
    spices: "Spices",
    "nuts-and-seeds": "Nuts & Seeds",
    "organic-foods": "Organic Foods",
  };

  return names[slug] ||
    slug.split("-").map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
}

export function mapProduct(item: ApiProduct): Product {
  return {
    id: item.slug,
    name: item.name,
    category: categoryName(item.categorySlug) as Product["category"],
    price: item.price,
    compareAt: item.compareAtPrice,
    unit: item.unit,
    image: item.images?.[0] || "/images/campaigns/healthy-food.jpg",
    accent: "#F4F1E9",
    badge: item.featured ? "FEATURED" : undefined,
    featured: item.featured,
  };
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Store API returned HTTP ${response.status}`);
  }

  const result = (await response.json()) as T;
  return result;
}

export async function fetchStoreProducts(): Promise<Product[]> {
  const first = await request<ProductsResponse>(
    "/products?page=1&limit=50"
  );

  if (!first.success) throw new Error("Product API failed");

  const output = [...first.data];

  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const result = await request<ProductsResponse>(
      `/products?page=${page}&limit=50`
    );
    if (!result.success) throw new Error("Product API failed");
    output.push(...result.data);
  }

  return output.map(mapProduct);
}

export async function fetchStoreCategories(): Promise<
  { name: Category; icon: string; description: string }[]
> {
  const result = await request<CategoriesResponse>("/categories");

  if (!result.success) throw new Error("Category API failed");

  return [
    { name: "All", icon: "✦", description: "Everything" },
    ...result.data.map((item) => ({
      name: item.name as Category,
      icon: "🌿",
      description: item.description || "Explore collection",
    })),
  ];
}

export async function fetchStoreProduct(
  slug: string
): Promise<Product | null> {
  const response = await fetch(
    `${API}/products/${encodeURIComponent(slug)}`,
    { cache: "no-store" }
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`Product API returned HTTP ${response.status}`);
  }

  const result = (await response.json()) as {
    success: boolean;
    data: ApiProduct;
  };

  if (!result.success) throw new Error("Product API failed");

  return mapProduct(result.data);
}
