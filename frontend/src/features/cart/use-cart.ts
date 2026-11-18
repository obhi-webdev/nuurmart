"use client";

import { useEffect, useState } from "react";
import { products, type Product } from "../products/catalog";

export type CartItem = {
  productId: string;
  quantity: number;
};

const STORAGE_KEY = "nuurmart-cart-v1";

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    products.some((product) => product.id === item.productId) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    item.quantity <= 99
  );
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter(isCartItem));
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
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(99, item.quantity + 1) }
            : item
        );
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0 && item.quantity <= 99)
    );
  }

  function remove(productId: string) {
    setItems((current) =>
      current.filter((item) => item.productId !== productId)
    );
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
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
