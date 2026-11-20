"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/features/cart/use-cart";
import { formatPrice } from "@/features/products/catalog";

const API = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

type Area = "inside_dhaka" | "outside_dhaka";

type Customer = {
  name: string;
  phone: string;
  district: string;
  address: string;
  note: string;
};

type Verified = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  signature: string;
};

type OrderResult = {
  orderNumber: string;
  total: number;
  status: string;
};

// NUURMART_CHECKOUT_RECOVERY_V1
// Stored only within the current browser tab.
const PENDING_KEY = "nuurmart-pending-cod-v1";

type OrderPayload = {
  requestId: string;
  customer: Customer;
  deliveryArea: Area;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

type PendingOrder = {
  version: 1;
  payload: OrderPayload;
  cartSignature: string;
};

function readPending(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;

    const value: unknown = JSON.parse(raw);

    if (!value || typeof value !== "object") {
      return null;
    }

    const pending = value as Partial<PendingOrder>;
    const payload = pending.payload;

    if (
      pending.version !== 1 ||
      typeof pending.cartSignature !== "string" ||
      !payload ||
      typeof payload.requestId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(payload.requestId) ||
      !payload.customer ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0 ||
      !["inside_dhaka", "outside_dhaka"].includes(
        payload.deliveryArea
      )
    ) {
      return null;
    }

    return pending as PendingOrder;
  } catch {
    return null;
  }
}

export default function PlaceOrderPage() {
  const cart = useCart();

  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    district: "",
    address: "",
    note: ""
  });

  const [area, setArea] = useState<Area>("outside_dhaka");
  const [verified, setVerified] = useState<Verified | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OrderResult | null>(null);
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    setPending(readPending());
    setRecoveryReady(true);
  }, []);

  const items = cart.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity
  }));

  const signature = JSON.stringify({ items, area });
  const quoteReady = verified?.signature === signature;

  function change(key: keyof Customer, value: string) {
    setCustomer(current => ({ ...current, [key]: value }));
  }

  async function verifyTotal() {
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setVerifying(true);
    setVerified(null);
    setError("");

    try {
      const [quoteResponse, feeResponse] = await Promise.all([
        fetch(`${API}/checkout/quote`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          cache: "no-store"
        }),
        fetch(`${API}/orders/delivery-fees`, {
          cache: "no-store"
        })
      ]);

      const quote = await quoteResponse.json();
      const fees = await feeResponse.json();

      if (!quoteResponse.ok || !quote.success) {
        throw new Error(
          quote.message || "Unable to verify product prices"
        );
      }

      if (!quote.canCheckout) {
        const problems = (
          quote.problems as Array<{ message: string }>
        ).map(item => item.message).join("; ");

        throw new Error(
          problems || "Some products are unavailable"
        );
      }

      if (!feeResponse.ok || !fees.success) {
        throw new Error(
          fees.message || "Delivery fee unavailable"
        );
      }

      const subtotal = Number(quote.subtotal);
      const deliveryFee = Number(fees.data[area]);

      if (
        !Number.isFinite(subtotal) ||
        !Number.isFinite(deliveryFee)
      ) {
        throw new Error("Invalid pricing response");
      }

      setVerified({
        subtotal,
        deliveryFee,
        total: Math.round(
          (subtotal + deliveryFee) * 100
        ) / 100,
        signature
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed"
      );
    } finally {
      setVerifying(false);
    }
  }

  async function sendOrder(attempt: PendingOrder) {
    if (sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    setError("");

    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(attempt.payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Order submission failed"
        );
      }

      if (
        !data.data ||
        typeof data.data.orderNumber !== "string" ||
        typeof data.data.total !== "number"
      ) {
        throw new Error(
          "Order response is incomplete. Retry recovery."
        );
      }

      // Clear the cart only when it still matches
      // the cart attached to this order attempt.
      const currentSignature = JSON.stringify(
        cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      );

      if (
        cart.loaded &&
        currentSignature === attempt.cartSignature
      ) {
        cart.clear();
      }

      sessionStorage.removeItem(PENDING_KEY);
      setPending(null);
      setResult(data.data as OrderResult);
    } catch (err) {
      // Keep the original request ID and payload.
      // A network error does not prove order failure.
      setPending(attempt);
      setError(
        err instanceof Error
          ? err.message
          : "Connection failed. Recover your existing order."
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function retryPending() {
    if (!pending || !recoveryReady || !cart.loaded) return;
    await sendOrder(pending);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !recoveryReady ||
      !cart.loaded ||
      pending ||
      sendingRef.current ||
      !quoteReady ||
      verifying ||
      items.length === 0
    ) return;

    const payload: OrderPayload = {
      requestId: crypto.randomUUID(),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        district: customer.district.trim(),
        address: customer.address.trim(),
        note: customer.note.trim()
      },
      deliveryArea: area,
      items: items.map(item => ({ ...item }))
    };

    const attempt: PendingOrder = {
      version: 1,
      payload,
      cartSignature: JSON.stringify(items)
    };

    // Persist before sending the request.
    // If persistence fails, do not risk an unsafe retry.
    try {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify(attempt)
      );
    } catch {
      setError(
        "Browser session storage is unavailable. " +
        "Order submission was stopped for safety."
      );
      return;
    }

    setPending(attempt);
    await sendOrder(attempt);
  }

  if (!recoveryReady || !cart.loaded) {
    return (
      <main className="nmcod-page">
        <section className="nmcod-success">
          <h1>Loading checkout...</h1>
          <p>Restoring your shopping session.</p>
        </section>
      </main>
    );
  }

  if (result) {
    return (
      <main className="nmcod-page">
        <section className="nmcod-success">
          <span>ORDER RECEIVED</span>
          <h1>Thank you for your order!</h1>
          <p>Your COD order has been recorded.</p>
          <div className="nmcod-order-number">
            <small>ORDER NUMBER</small>
            <strong>{result.orderNumber}</strong>
          </div>
          <div className="nmcod-total">
            <span>Total</span>
            <strong>{formatPrice(result.total)}</strong>
          </div>
          <Link href="/orders/track">
            Track Your Order
          </Link>
          <Link href="/">Continue Shopping</Link>
        </section>
      </main>
    );
  }

  if (pending) {
    return (
      <main className="nmcod-page">
        <section className="nmcod-success">
          <span>ORDER RECOVERY</span>
          <h1>Recover your order</h1>
          <p>
            Your previous checkout attempt may already
            have reached NuurMart. Retry with the same
            order details to recover its confirmation.
          </p>
          <p>
            We will not create a different Request ID
            for this retry.
          </p>

          {error && (
            <p className="nmcod-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="nmcod-submit"
            onClick={() => void retryPending()}
            disabled={sending}
          >
            {sending
              ? "Checking previous order..."
              : "Recover Previous Order"}
          </button>

          <p>
            Do not submit a new checkout until the
            previous attempt has been resolved.
          </p>

          <Link href="/orders/track">
            Track an Existing Order
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="nmcod-page">
      <div className="nmcod-container">
        <nav className="nmcod-nav">
          <Link href="/checkout">← Back to Cart</Link>
          <span>CASH ON DELIVERY</span>
        </nav>

        <div className="nmcod-heading">
          <span>NUURMART CHECKOUT</span>
          <h1>Delivery Information</h1>
          <p>Enter your details and review the final total.</p>
        </div>

        <div className="nmcod-grid">
          <section className="nmcod-panel">
            <h2>Shipping Details</h2>

            <form className="nmcod-form" onSubmit={submit}>
              <label>
                Full Name
                <input
                  required minLength={2} maxLength={100}
                  autoComplete="name"
                  value={customer.name}
                  onChange={e => change("name", e.target.value)}
                />
              </label>

              <label>
                Mobile Number
                <input
                  required type="tel"
                  pattern="(\+?88)?01[3-9][0-9]{8}"
                  placeholder="01XXXXXXXXX"
                  value={customer.phone}
                  onChange={e => change("phone", e.target.value)}
                />
              </label>

              <label>
                District
                <input
                  required minLength={2} maxLength={100}
                  value={customer.district}
                  onChange={e => change("district", e.target.value)}
                />
              </label>

              <label>
                Full Delivery Address
                <textarea
                  required minLength={10} maxLength={500}
                  rows={4}
                  value={customer.address}
                  onChange={e => change("address", e.target.value)}
                />
              </label>

              <label>
                Delivery Area
                <select
                  value={area}
                  onChange={e =>
                    setArea(e.target.value as Area)
                  }
                >
                  <option value="inside_dhaka">
                    Inside Dhaka
                  </option>
                  <option value="outside_dhaka">
                    Outside Dhaka
                  </option>
                </select>
              </label>

              <label>
                Order Note (Optional)
                <textarea
                  rows={3} maxLength={500}
                  value={customer.note}
                  onChange={e => change("note", e.target.value)}
                />
              </label>

              {error && (
                <p className="nmcod-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="nmcod-submit"
                type="submit"
                disabled={
                  !quoteReady ||
                  !recoveryReady || !cart.loaded ||
                  sending ||
                  verifying ||
                  items.length === 0
                }
              >
                {sending ? "Submitting..." : "Place COD Order"}
              </button>
            </form>
          </section>

          <aside className="nmcod-panel nmcod-summary">
            <h2>Order Summary</h2>

            {cart.items.map(item => (
              <div className="nmcod-line" key={item.productId}>
                <div>
                  <strong>
                    {item.product?.name || item.productId}
                  </strong>
                  <small>Quantity: {item.quantity}</small>
                </div>
              </div>
            ))}

            <p className="nmcod-notice">
              Cart estimate: {formatPrice(cart.subtotal)}
              . Final prices come from the server.
            </p>

            <button
              type="button"
              className="nmcod-submit"
              onClick={() => void verifyTotal()}
              disabled={verifying || items.length === 0}
            >
              {verifying
                ? "Verifying..."
                : "Verify Final Total"}
            </button>

            {quoteReady && verified && (
              <div className="nmcod-verified">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatPrice(verified.subtotal)}</strong>
                </div>
                <div>
                  <span>Delivery Fee</span>
                  <strong>{formatPrice(verified.deliveryFee)}</strong>
                </div>
                <div>
                  <span>Final COD Total</span>
                  <strong>{formatPrice(verified.total)}</strong>
                </div>
              </div>
            )}

            {!quoteReady && (
              <p className="nmcod-notice">
                Verify your final total before placing the order.
              </p>
            )}

            <p className="nmcod-notice">
              Payment Method: Cash on Delivery.
              The server rechecks stock and price on submission.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
