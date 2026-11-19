"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight, ChevronRight, Leaf,
  Search, ShoppingBag, SlidersHorizontal
} from "lucide-react";
import {
  type Category
} from "@/features/products/catalog";
import {
  categoryUrl
} from "@/features/products/routes";
import { ProductCard } from "@/components/home/ProductCard";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { useCart } from "@/features/cart/use-cart";
import { useStoreCatalog } from "@/hooks/use-store-catalog";

type Sort = "featured" | "low" | "high" | "name";

export function CollectionView({
  initialCategory,
}: {
  initialCategory: Category;
}) {
  const [category, setCategory] = useState<Category>(initialCategory);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [maxPrice, setMaxPrice] = useState(3000);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const cart = useCart();
  const { products, categories, loading, error } = useStoreCatalog();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    const result = products.filter((product) =>
      (category === "All" || product.category === category) &&
      product.price <= maxPrice &&
      (!term ||
        `${product.name} ${product.category}`
          .toLowerCase().includes(term))
    );

    if (sort === "low") result.sort((a, b) => a.price - b.price);
    if (sort === "high") result.sort((a, b) => b.price - a.price);
    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "featured") {
      result.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    }

    return result;
  }, [category, query, sort, maxPrice]);

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <>
      <header className="nm4-top">
        <div className="nm-container nm4-top-inner">
          <Link href="/" className="nm4-brand">
            <Leaf size={22} /> NUURMART
          </Link>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/collections">Shop All</Link>
          </nav>
          <button className="nm4-bag" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} /> Bag ({cart.count})
          </button>
        </div>
      </header>

      <main className="nm4-page">
        <section className="nm4-collection-hero">
          <div className="nm-container">
            <nav className="nm4-breadcrumb">
              <Link href="/">Home</Link>
              <ChevronRight size={14} />
              <span>Collections</span>
            </nav>
            <span className="nm4-eyebrow">THE NUURMART COLLECTION</span>
            <h1>
              {category === "All" ? "Shop All" : category}
              <em> Essentials</em>
            </h1>
            <p>
              Thoughtfully selected grocery favourites
              for better everyday shopping.
            </p>
          </div>
        </section>

        <section className="nm-container nm4-collection-body">
          <aside className="nm4-sidebar">
            <div className="nm4-sidebar-title">
              <SlidersHorizontal size={19} /> Refine Selection
            </div>

            <h3>Categories</h3>
            <div className="nm4-filter-categories">
              {categories.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={category === item.name ? "active" : ""}
                  onClick={() => {
                    setCategory(item.name);
                    window.history.replaceState(
                      null, "",
                      item.name === "All"
                        ? "/collections"
                        : categoryUrl(item.name)
                    );
                  }}
                >
                  <span>{item.name === "All" ? "All Products" : item.name}</span>
                  <span>
                    {item.name === "All"
                      ? products.length
                      : products.filter((p) => p.category === item.name).length}
                  </span>
                </button>
              ))}
            </div>

            <h3>Maximum Price</h3>
            <div className="nm4-price-filter">
              <div>Up to ৳{maxPrice.toLocaleString("en-BD")}</div>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(Number(event.target.value))
                }
                aria-label="Maximum price"
              />
              <div className="nm4-price-limits">
                <span>৳0</span><span>৳3,000</span>
              </div>
            </div>

            <button
              type="button"
              className="nm4-clear"
              onClick={() => {
                setCategory("All");
                setMaxPrice(3000);
                setQuery("");
                setSort("featured");
                window.history.replaceState(null, "", "/collections");
              }}
            >
              Clear All Filters
            </button>
          </aside>

          <div className="nm4-collection-main">
            <div className="nm4-collection-controls">
              <label className="nm4-collection-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search the collection..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <label className="nm4-sort">
                <span>Sort:</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as Sort)}
                >
                  <option value="featured">Featured</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </label>
            </div>

            <p className="nm4-result-count">
              Showing {filtered.length} of {products.length} demo products
            </p>

            {error ? (
              <div className="nm4-empty" role="alert">
                <h2>Catalog unavailable</h2>
                <p>{error}</p>
              </div>
            ) : loading ? (
              <div className="nm4-empty" role="status">
                <h2>Loading products...</h2>
              </div>
            ) : filtered.length > 0 ? (
              <div className="nm4-collection-grid">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    favorite={favorites.includes(product.id)}
                    onFavorite={toggleFavorite}
                    onAdd={(item) => {
                      cart.add(item);
                      setCartOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="nm4-empty">
                <h2>No products found</h2>
                <p>Try adjusting your search or price range.</p>
                <button onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setMaxPrice(3000);
                  window.history.replaceState(null, "", "/collections");
                }}>
                  Reset Filters <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
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
