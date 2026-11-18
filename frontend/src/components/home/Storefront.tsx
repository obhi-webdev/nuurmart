"use client";
import Image from "next/image";
import Link from "next/link";


import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { categoryUrl } from "@/features/products/routes";
import { ProductCard } from "@/components/home/ProductCard";
import { PremiumHero } from "@/components/home/hero/PremiumHero";
import { PromoBanners } from "@/components/home/promotions/PromoBanners";
import {
  categories,
  products,
  type Category,
} from "@/features/products/catalog";
import { useCart } from "@/features/cart/use-cart";

const categoryPhotos: Record<string, string> = {
  Honey: "/images/categories/honey.jpg",
  Dates: "/images/categories/dates.jpg",
  "Oil & Ghee": "/images/categories/oil.jpg",
  Spices: "/images/categories/spices.jpg",
  "Nuts & Seeds": "/images/categories/nuts.jpg",
  "Organic Foods": "/images/categories/rice.jpg",
};

export function Storefront() {
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart();
  // nm3-wishlist-state: session-only wishlist until account APIs exist.
  const [favorites, setFavorites] = useState<string[]>([]);

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }


  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch =
        category === "All" || product.category === category;
      const queryMatch =
        !term ||
        `${product.name} ${product.category} ${product.unit}`
          .toLowerCase()
          .includes(term);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  function shopCategory(value: Category) {
    setCategory(value);
    document.getElementById("shop")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  function addToCart(product: (typeof products)[number]) {
    cart.add(product);
    setCartOpen(true);
  }

  return (
    <>
      <StoreHeader
        count={cart.count}
        query={query}
        onQuery={setQuery}
        onCart={() => setCartOpen(true)}
        onCategory={setCategory}
      />

      <main>
        <PremiumHero />
        <PromoBanners />

        <section className="nm-benefits">
          <div className="nm-container nm-benefits-inner">
            <div><Truck size={20} /><span>Convenient Delivery</span></div>
            <div><ShieldCheck size={20} /><span>Quality-Focused Selection</span></div>
            <div><PackageCheck size={20} /><span>Carefully Packed</span></div>
            <div><Leaf size={20} /><span>Naturally Inspired</span></div>
          </div>
        </section>

        <section className="nm-section nm-categories-section" id="categories">
          <div className="nm-container">
            <div className="nm-section-heading">
              <div>
                <span className="nm-eyebrow">FIND YOUR ESSENTIALS</span>
                <h2>Shop by <em>Category</em></h2>
              </div>
              <Link href="/collections" className="nm-text-link">
                Explore All <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="nm-categories-grid">
              {categories.filter((item) => item.name !== "All").map((item) => (
                <Link
                  key={item.name}
                  href={categoryUrl(item.name)}
                  className="nm-category-card"
                >
                  <div className="nm-category-art">
                    <Image
                      src={categoryPhotos[item.name]}
                      alt={`${item.name} category`}
                      fill
                      sizes="(max-width: 760px) 33vw, 17vw"
                      className="nm3-category-photo"
                    />
                  </div>
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="nm-section nm-shop-section" id="shop">
          <div className="nm-container">
            <div className="nm-section-heading">
              <div>
                <span className="nm-eyebrow">THE NUURMART EDIT</span>
                <h2>Curated for <em>You</em></h2>
                <p>Everyday essentials, with a little more care.</p>
              </div>
              <div className="nm-product-counter">
                {filtered.length} PRODUCTS
              </div>
            </div>

            <div className="nm-filters">
              {categories.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={category === item.name ? "active" : ""}
                  onClick={() => setCategory(item.name)}
                >
                  {item.name === "All" ? "All Products" : item.name}
                </button>
              ))}
            </div>

            {filtered.length > 0 ? (
              <div className="nm-product-grid">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                    favorite={favorites.includes(product.id)}
                    onFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="nm-no-results">
                <h3>No matching products found.</h3>
                <p>Try another search or select a different category.</p>
                <button
                  className="nm-btn nm-btn-dark"
                  onClick={() => {
                    setQuery("");
                    setCategory("All");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="nm-story" id="story">
          <div className="nm-container nm-story-inner">
            <div className="nm-story-art">
              <span className="nm-story-leaf">🌿</span>
              <span className="nm-story-art-caption">
                THE GOODNESS OF NATURE
              </span>
            </div>
            <div className="nm-story-copy">
              <span className="nm-eyebrow">THE NUURMART PHILOSOPHY</span>
              <h2>
                A little more <em>care</em>
                <br />
                in every choice.
              </h2>
              <p>
                We believe that better everyday living begins with
                thoughtful choices. NuurMart brings together grocery
                essentials, natural ingredients and comforting
                favourites in one considered shopping experience.
              </p>
              <div className="nm-story-values">
                <span><Check size={17} /> Thoughtful Selection</span>
                <span><Check size={17} /> Everyday Essentials</span>
                <span><Check size={17} /> Simple Shopping</span>
              </div>
              <a href="#shop" className="nm-btn nm-btn-light">
                Discover Our Collection <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
        </section>

        <section className="nm-newsletter">
          <div className="nm-container nm-newsletter-inner">
            <div>
              <span className="nm-eyebrow">STAY IN THE LOOP</span>
              <h2>Good things are <em>coming.</em></h2>
              <p>New collections and thoughtful offers, all in one place.</p>
            </div>
            <div className="nm-newsletter-note">
              <Leaf size={24} />
              <span>Follow our journey as NuurMart grows.</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="nm-footer">
        <div className="nm-container nm-footer-grid">
          <div>
            <a href="/" className="nm-logo nm-footer-logo">
              <span className="nm-logo-symbol">✳</span>
              <span>NUUR<span>MART</span><small>NATURALLY GOOD</small></span>
            </a>
            <p>
              A fresh perspective on everyday grocery shopping.
              Simple, thoughtful, naturally good.
            </p>
          </div>
          <div>
            <h4>EXPLORE</h4>
            <a href="#shop">Shop All</a>
            <a href="#categories">Categories</a>
            <a href="#story">Our Story</a>
          </div>
          <div>
            <h4>SHOPPING</h4>
            <a href="#shop">Honey & Dates</a>
            <a href="#shop">Organic Essentials</a>
            <a href="#shop">New Collections</a>
          </div>
          <div>
            <h4>NUURMART</h4>
            <p>Bangladesh</p>
            <p>Customer support details coming soon.</p>
          </div>
        </div>
        <div className="nm-container nm-footer-bottom">
          <span>© {new Date().getFullYear()} NuurMart. All rights reserved.</span>
          <span>MADE WITH CARE <Leaf size={14} /></span>
        </div>
      </footer>

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
