"use client";

import { useEffect, useState } from "react";
import { products, type Product } from "../products/catalog";

export type CartItem = {
  productId: string;
  quantity: number;
  product?: Product;
};

const STORAGE_KEY = "nuurmart-cart-v1";

function validItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<CartItem>;

  if (
    typeof item.productId !== "string" ||
    item.productId.length > 120 ||
    !Number.isInteger(item.quantity) ||
    !item.quantity ||
    item.quantity < 1 ||
    item.quantity > 99
  ) return false;

  if (item.product !== undefined) {
    const product = item.product;

    if (
      !product ||
      product.id !== item.productId ||
      typeof product.name !== "string" ||
      typeof product.category !== "string" ||
      typeof product.unit !== "string" ||
      typeof product.image !== "string" ||
      typeof product.accent !== "string" ||
      typeof product.price !== "number" ||
      !Number.isFinite(product.price) ||
      product.price < 0
    ) return false;
  } else if (!products.some((p) => p.id === item.productId)) {
    return false;
  }

  return true;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed: unknown = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          setItems(parsed.filter(validItem).slice(0, 100));
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  function add(product: Product) {
    setItems((current) => {
      const existing = current.find(
        (item) => item.productId === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                product,
                quantity: Math.min(99, item.quantity + 1),
              }
            : item
        );
      }

      return [
        ...current,
        { productId: product.id, quantity: 1, product },
      ];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  Math.min(99, item.quantity + delta)
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function remove(productId: string) {
    setItems((current) =>
      current.filter((item) => item.productId !== productId)
    );
  }

  const count = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = items.reduce((sum, item) => {
    const product = item.product ??
      products.find((p) => p.id === item.productId);

    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  return {
    items,
    count,
    subtotal,
    add,
    remove,
    changeQuantity,
  };
}
