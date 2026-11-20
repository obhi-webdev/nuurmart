"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Package,
  Search,
  ShieldCheck,
  Truck
} from "lucide-react";
import { formatPrice } from "@/features/products/catalog";

const API = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

type Tracking = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
};

const steps = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered"
];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API}/orders/track`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim().toUpperCase(),
          phone: phone.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to find your order"
        );
      }

      setResult(data.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Tracking failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const currentStep = result
    ? steps.indexOf(result.status)
    : -1;

  return (
    <main className="nmt-page">
      <div className="nmt-container">
        <nav className="nmt-nav">
          <Link href="/">
            <ArrowLeft size={17} />
            Back to Store
          </Link>
          <span>NUURMART / ORDER TRACKING</span>
        </nav>

        <header className="nmt-heading">
          <span>YOUR ORDER JOURNEY</span>
          <h1>Track your order.</h1>
          <p>
            Enter your Order Number and the Mobile Number
            used during checkout.
          </p>
        </header>

        <div className="nmt-layout">
          <section className="nmt-card">
            <div className="nmt-icon">
              <Package size={26}/>
            </div>

            <h2>Find Your Order</h2>

            <form onSubmit={search} className="nmt-form">
              <label>
                Order Number
                <input
                  required
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  placeholder="NM-XXXXXXXX-XXXXXXXX"
                  maxLength={80}
                />
              </label>

              <label>
                Mobile Number
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  maxLength={16}
                />
              </label>

              {error && (
                <p className="nmt-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}>
                <Search size={17}/>
                {loading ? "Searching..." : "Track My Order"}
              </button>
            </form>

            <p className="nmt-privacy">
              <ShieldCheck size={17}/>
              Order details require both Order Number and
              the matching Phone Number.
            </p>
          </section>

          <section className="nmt-card nmt-status-card">
            {!result ? (
              <div className="nmt-placeholder">
                <Truck size={53} strokeWidth={1.1}/>
                <h2>Know where your order stands</h2>
                <p>
                  Your current Order Status will appear
                  here after verification.
                </p>
              </div>
            ) : (
              <>
                <div className="nmt-result-top">
                  <span>ORDER STATUS</span>
                  <strong>{result.status.toUpperCase()}</strong>
                </div>

                <h2>{result.orderNumber}</h2>

                <p className="nmt-order-date">
                  Ordered on{" "}
                  {new Date(result.createdAt).toLocaleDateString("en-BD")}
                </p>

                {result.status === "cancelled" ? (
                  <div className="nmt-cancelled">
                    This order has been cancelled.
                  </div>
                ) : (
                  <div className="nmt-steps">
                    {steps.map((step, index) => (
                      <div
                        key={step}
                        className={
                          "nmt-step" +
                          (index <= currentStep
                            ? " nmt-step-complete"
                            : "")
                        }
                      >
                        <span>
                          {index <= currentStep
                            ? <CheckCircle2 size={21}/>
                            : <Clock3 size={21}/>}
                        </span>
                        <strong>
                          {step.charAt(0).toUpperCase() + step.slice(1)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}

                <div className="nmt-result-total">
                  <span>Order Total</span>
                  <strong>{formatPrice(result.total)}</strong>
                </div>

                <p className="nmt-payment">
                  Payment: {result.paymentStatus}
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
