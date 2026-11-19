"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight,
  Leaf, Minus, Plus, ShieldCheck, ShoppingBag, Truck
} from "lucide-react";
import {
  formatPrice, type Product
} from "@/features/products/catalog";
import {
  categoryUrl, productUrl
} from "@/features/products/routes";
import { useCart } from "@/features/cart/use-cart";
import { useStoreCatalog } from "@/hooks/use-store-catalog";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ProductCard } from "@/components/home/ProductCard";

export function ProductDetails({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const cart = useCart();
  const { products } = useStoreCatalog();

  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  const related = products
    .filter((item) =>
      item.id !== product.id && item.category === product.category
    )
    .concat(
      products.filter(
        (item) =>
          item.id !== product.id && item.category !== product.category
      )
    )
    .slice(0, 4);

  function add(selected: Product, amount = 1) {
    for (let i = 0; i < amount; i++) {
      cart.add(selected);
    }
    setCartOpen(true);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <>
      <div className="nm4-top">
        <div className="nm-container nm4-top-inner">
          <Link href="/" className="nm4-brand">
            <Leaf size={22} /> NUURMART
          </Link>
          <nav aria-label="Store navigation">
            <Link href="/">Home</Link>
            <Link href="/collections">Shop All</Link>
          </nav>
          <button
            type="button"
            className="nm4-bag"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={20} />
            <span>Bag ({cart.count})</span>
          </button>
        </div>
      </div>

      <main className="nm4-page">
        <div className="nm-container">
          <nav className="nm4-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={14} />
            <Link href={categoryUrl(product.category)}>
              {product.category}
            </Link>
            <ChevronRight size={14} />
            <span>{product.name}</span>
          </nav>

          <div className="nm4-detail-grid">
            <div className="nm4-image-area">
              <div className="nm4-main-image">
                <Image
                  src={product.image}
                  alt={`Demo product photography: ${product.name}`}
                  fill
                  priority
                  sizes="(max-width: 850px) 100vw, 50vw"
                  className="nm4-image-cover"
                />
                {discount > 0 && (
                  <span className="nm4-discount">SAVE {discount}%</span>
                )}
              </div>
              <p className="nm4-photo-note">
                Illustrative product photo. Actual packaging may differ.
              </p>
            </div>

            <section className="nm4-detail-copy">
              <span className="nm4-eyebrow">
                NUURMART / {product.category.toUpperCase()}
              </span>
              <h1>{product.name}</h1>
              <p className="nm4-subtitle">
                Thoughtfully selected grocery essentials
              </p>

              <div className="nm4-price">
                <strong>{formatPrice(product.price)}</strong>
                {product.compareAt && (
                  <del>{formatPrice(product.compareAt)}</del>
                )}
              </div>

              <div className="nm4-divider" />

              <div className="nm4-detail-row">
                <span>Pack size</span>
                <strong>{product.unit}</strong>
              </div>
              <div className="nm4-detail-row">
                <span>Category</span>
                <Link href={categoryUrl(product.category)}>
                  {product.category} <ArrowRight size={14} />
                </Link>
              </div>

              <div className="nm4-divider" />

              <p className="nm4-description">
                Discover a carefully selected addition to your
                everyday pantry. Full sourcing details, ingredients,
                nutrition information and actual stock availability
                will be published when the official product catalog
                is connected.
              </p>

              <div className="nm4-quantity-group">
                <span>Quantity</span>
                <div className="nm4-quantity">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <output>{quantity}</output>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="Increase quantity"
                    disabled={quantity >= 99}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="nm4-add-cart"
                onClick={() => add(product, quantity)}
              >
                <ShoppingBag size={19} />
                Add to Bag — {formatPrice(product.price * quantity)}
                <ArrowRight size={18} />
              </button>

              <div className="nm4-assurances">
                <div><Truck size={20} /><span>Delivery details at checkout</span></div>
                <div><ShieldCheck size={20} /><span>Secure shopping experience planned</span></div>
                <div><Check size={20} /><span>Product details being finalized</span></div>
              </div>
            </section>
          </div>

          <section className="nm4-related">
            <div className="nm4-section-head">
              <div>
                <span className="nm4-eyebrow">DISCOVER MORE</span>
                <h2>You may also <em>love</em></h2>
              </div>
              <Link href="/collections">
                Shop All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="nm-product-grid">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onAdd={(chosen) => add(chosen)}
                  favorite={favorites.includes(item.id)}
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>

          <Link href={productUrl(product.id)} className="nm4-canonical-note">
            <ArrowLeft size={14} /> Product details
          </Link>
        </div>
      </main>

      <CartDrawer
        open={cartOpen}
        items={cart.items}
        subtotal={cart.subtotal}
        onClose={() => setCartOpen(false)}
        onRemove={cart.remove}
        onQuantity={cart.changeQuantity}
      />
    </>
  );
}
