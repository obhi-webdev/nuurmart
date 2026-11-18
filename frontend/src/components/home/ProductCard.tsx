"use client";

import Image from "next/image";
import {
  ArrowUpRight,
  Heart,
  ShoppingBag,
  Star,
} from "lucide-react";
import {
  formatPrice,
  type Product,
} from "@/features/products/catalog";

type Props = {
  product: Product;
  onAdd: (product: Product) => void;
  favorite?: boolean;
  onFavorite?: (productId: string) => void;
};

export function ProductCard({
  product,
  onAdd,
  favorite = false,
  onFavorite,
}: Props) {
  const discount = product.compareAt
    ? Math.round(
        ((product.compareAt - product.price) / product.compareAt) * 100
      )
    : 0;

  return (
    <article className="nm3-product">
      <div className="nm3-product-media">
        <Image
          src={product.image}
          alt={`Demo photography for ${product.name}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
          className="nm3-product-photo"
        />

        <div className="nm3-product-labels">
          {product.badge && (
            <span className="nm3-label-featured">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="nm3-label-discount">
              -{discount}%
            </span>
          )}
        </div>

        <button
          type="button"
          className={`nm3-wishlist ${favorite ? "selected" : ""}`}
          onClick={() => onFavorite?.(product.id)}
          aria-label={
            favorite
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={favorite}
          title="Wishlist"
        >
          <Heart
            size={19}
            fill={favorite ? "currentColor" : "none"}
          />
        </button>

        <button
          type="button"
          className="nm3-quick-add"
          onClick={() => onAdd(product)}
        >
          <ShoppingBag size={16} />
          <span>Quick Add</span>
          <ArrowUpRight size={15} />
        </button>
      </div>

      <div className="nm3-product-content">
        <div className="nm3-product-meta">
          <span>{product.category}</span>
          <span className="nm3-product-stars" aria-label="Rating coming soon">
            <Star size={12} />
            NEW
          </span>
        </div>

        <h3>{product.name}</h3>

        <p className="nm3-product-unit">{product.unit}</p>

        <div className="nm3-product-price">
          <strong>{formatPrice(product.price)}</strong>
          {product.compareAt && (
            <del>{formatPrice(product.compareAt)}</del>
          )}
        </div>

        <button
          type="button"
          className="nm3-add-button"
          onClick={() => onAdd(product)}
        >
          <ShoppingBag size={16} />
          Add to Cart
          <ArrowUpRight size={16} />
        </button>
      </div>
    </article>
  );
}
