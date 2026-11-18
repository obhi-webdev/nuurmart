"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import {
  formatPrice,
  type Product,
} from "@/features/products/catalog";

type Props = {
  product: Product;
  onAdd: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: Props) {
  return (
    <article className="nm-product">
      <div
        className="nm-product-visual"
        style={{ backgroundColor: product.accent }}
      >
        {product.badge && (
          <span className="nm-product-badge">{product.badge}</span>
        )}
        <span
          className="nm-product-art"
          role="img"
          aria-label={`${product.category} illustration`}
        >
          {product.image}
        </span>
        <button
          type="button"
          className="nm-product-quick"
          onClick={() => onAdd(product)}
          aria-label={`Add ${product.name} to cart`}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="nm-product-info">
        <p className="nm-product-category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="nm-product-unit">{product.unit}</p>

        <div className="nm-product-bottom">
          <div className="nm-price">
            <strong>{formatPrice(product.price)}</strong>
            {product.compareAt && (
              <del>{formatPrice(product.compareAt)}</del>
            )}
          </div>
          <button
            className="nm-product-arrow"
            type="button"
            onClick={() => onAdd(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <ArrowUpRight size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
