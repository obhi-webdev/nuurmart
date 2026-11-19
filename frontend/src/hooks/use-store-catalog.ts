"use client";

import { useEffect, useState } from "react";
import type { Product, Category } from "@/features/products/catalog";
import {
  fetchStoreProducts,
  fetchStoreCategories,
} from "@/services/store-api";

type StoreCategory = {
  name: Category;
  icon: string;
  description: string;
};

export function useStoreCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([
    { name: "All", icon: "✦", description: "Everything" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [items, groups] = await Promise.all([
          fetchStoreProducts(),
          fetchStoreCategories(),
        ]);

        if (!active) return;

        setProducts(items);
        setCategories(groups);
        setError(null);
      } catch (error) {
        if (!active) return;

        setError(
          error instanceof Error ? error.message : "Unable to load catalog"
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { products, categories, loading, error };
}
