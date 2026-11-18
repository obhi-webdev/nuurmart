"use client";

import {
  ArrowRight,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Category } from "@/features/products/catalog";

type Props = {
  count: number;
  query: string;
  onQuery: (value: string) => void;
  onCart: () => void;
  onCategory: (value: Category) => void;
};

export function StoreHeader({
  count,
  query,
  onQuery,
  onCart,
  onCategory,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation: Category[] = [
    "All",
    "Honey",
    "Dates",
    "Oil & Ghee",
    "Spices",
    "Nuts & Seeds",
    "Organic Foods",
  ];

  function selectCategory(value: Category) {
    onCategory(value);
    setMobileOpen(false);
    document.getElementById("shop")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <>
      <div className="nm-announcement">
        Thoughtfully sourced. Naturally better.
        <span> Discover the NuurMart experience <ArrowRight size={13} /></span>
      </div>

      <header className="nm-header">
        <div className="nm-container nm-header-inner">
          <button
            type="button"
            className="nm-mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>

          <a className="nm-logo" href="/" aria-label="NuurMart homepage">
            <span className="nm-logo-symbol">✳</span>
            <span>
              NUUR<span>MART</span>
              <small>NATURALLY GOOD</small>
            </span>
          </a>

          <label className="nm-search">
            <Search size={19} />
            <input
              type="search"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search honey, dates, organic essentials..."
              aria-label="Search products"
            />
            <span>SEARCH</span>
          </label>

          <div className="nm-header-actions">
            <span className="nm-account" title="Customer account coming soon">
              <UserRound size={21} />
              <span>Account</span>
            </span>
            <button
              type="button"
              onClick={onCart}
              className="nm-cart-button"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag size={22} />
              <span>Cart</span>
              {count > 0 && <i>{count}</i>}
            </button>
          </div>
        </div>
      </header>

      <nav className={`nm-nav ${mobileOpen ? "nm-nav-open" : ""}`}>
        <div className="nm-container nm-nav-inner">
          {navigation.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => selectCategory(item)}
            >
              {item === "All" ? "Shop All" : item}
            </button>
          ))}
          <a href="#story" onClick={() => setMobileOpen(false)}>
            Our Story
          </a>
        </div>
      </nav>
    </>
  );
}
