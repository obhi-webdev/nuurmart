"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ShoppingBasket,
  TriangleAlert
} from "lucide-react";
import { useCart } from "@/features/cart/use-cart";
import {
  formatPrice,
  products as demoProducts
} from "@/features/products/catalog";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

type QuoteLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number | null;
  image: string | null;
};

type Quote = {
  success: boolean;
  canCheckout: boolean;
  currency: "BDT";
  items: QuoteLine[];
  problems: {
    productId: string;
    message: string;
  }[];
  subtotal: number;
  note: string;
};

export default function CheckoutPage() {
  const cart = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkoutItems = useMemo(
    () => cart.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    })),
    [cart.items]
  );

  const cartSignature = JSON.stringify(checkoutItems);

  useEffect(() => {
    setQuote(null);
    setError("");
  }, [cartSignature]);

  async function verify() {
    if (checkoutItems.length === 0) {
      setQuote(null);
      setError("Your shopping bag is empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/checkout/quote`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: checkoutItems })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to verify your cart"
        );
      }

      setQuote(result as Quote);
    } catch (err) {
      setQuote(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify your cart"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="nm-checkout">
      <div className="nm-checkout-container">
        <header className="nm-checkout-header">
          <Link href="/" className="nm-checkout-logo">
            <ShoppingBasket size={26} />
            NUURMART
          </Link>

          <span>
            <ShieldCheck size={17} />
            CHECKOUT PREVIEW
          </span>
        </header>

        <nav className="nm-checkout-back">
          <Link href="/collections">
            <ArrowLeft size={17} />
            Continue Shopping
          </Link>
        </nav>

        <div className="nm-checkout-heading">
          <span>YOUR SHOPPING EXPERIENCE</span>
          <h1>Review your bag.</h1>
          <p>
            Verify current product prices and availability
            directly from NuurMart inventory.
          </p>
        </div>

        <div className="nm-checkout-grid">
          <section className="nm-checkout-card">
            <h2>Shopping Bag ({cart.count})</h2>

            {cart.items.length === 0 ? (
              <div className="nm-checkout-empty">
                Your shopping bag is empty.
                <Link href="/collections">Browse Products</Link>
              </div>
            ) : (
              <div className="nm-checkout-items">
                {cart.items.map(item => {
                  const product = item.product ??
                    demoProducts.find(p => p.id === item.productId);

                  return (
                    <article
                      className="nm-checkout-item"
                      key={item.productId}
                    >
                      <div>
                        <strong>
                          {product?.name || item.productId}
                        </strong>
                        <span>Quantity: {item.quantity}</span>
                        <small>
                          Current price will be verified with MongoDB
                        </small>
                      </div>

                      <div className="nm-checkout-item-actions">
                        <button
                          type="button"
                          aria-label="Decrease item quantity"
                          onClick={() =>
                            cart.changeQuantity(item.productId, -1)
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase item quantity"
                          onClick={() =>
                            cart.changeQuantity(item.productId, 1)
                          }
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => cart.remove(item.productId)}
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <button
              className="nm-checkout-verify"
              type="button"
              disabled={loading || checkoutItems.length === 0}
              onClick={() => void verify()}
            >
              <RefreshCw size={18} />
              {loading ? "Verifying inventory..." : "Verify Price & Stock"}
              <ArrowRight size={18} />
            </button>
          </section>

          <aside className="nm-checkout-card nm-checkout-summary">
            <h2>Order Summary</h2>

            {error && (
              <div className="nm-checkout-error" role="alert">
                <TriangleAlert size={18} />
                {error}
              </div>
            )}

            {quote && (
              <>
                {quote.problems.length > 0 && (
                  <div className="nm-checkout-error">
                    <TriangleAlert size={18} />
                    <div>
                      <strong>Some items need attention</strong>
                      {quote.problems.map(problem => (
                        <p key={problem.productId}>
                          {problem.productId}: {problem.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {quote.items.map(line => (
                  <div
                    className="nm-checkout-summary-row"
                    key={line.productId}
                  >
                    <span>{line.name} × {line.quantity}</span>
                    <strong>{formatPrice(line.lineTotal)}</strong>
                  </div>
                ))}

                <div className="nm-checkout-total">
                  <span>Verified Subtotal</span>
                  <strong>{formatPrice(quote.subtotal)}</strong>
                </div>

                {quote.canCheckout ? (
                  <div className="nm-checkout-success">
                    <CheckCircle2 size={20} />
                    Prices and quantities verified at this moment.
                  </div>
                ) : (
                  <p className="nm-checkout-warning">
                    Adjust unavailable items and verify again.
                  </p>
                )}
              </>
            )}

            {!quote && !error && (
              <p className="nm-checkout-placeholder">
                Select Verify Price & Stock to retrieve a
                server-validated summary.
              </p>
            )}

            <div className="nm-checkout-notice">
              <ShieldCheck size={20} />
              <p>
                Order placement and payment are not enabled yet.
                This is an inventory and pricing preview.
              </p>
            </div>

            <button className="nm-checkout-disabled" disabled>
              Place Order — Coming Soon
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
