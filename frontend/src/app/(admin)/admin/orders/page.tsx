"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageCheck, RefreshCw } from "lucide-react";
import { adminMe } from "@/services/admin-api";
import { formatPrice } from "@/features/products/catalog";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

type Order = {
  _id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    district: string;
    address: string;
    note: string;
  };
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
};

const nextStates: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      await adminMe();

      const response = await fetch(`${API}/admin/orders`, {
        credentials: "include",
        cache: "no-store"
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to fetch orders");
      }

      setOrders(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load orders"
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(
    order: Order,
    status: OrderStatus
  ) {
    if (updating) return;

    if (
      status === "cancelled" &&
      !window.confirm(
        `Cancel order ${order.orderNumber} and release reserved stock?`
      )
    ) return;

    setUpdating(order._id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/admin/orders/${order._id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update order");
      }

      setMessage(`${order.orderNumber}: ${status}`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Status update failed"
      );
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="nma-manage">
      <div className="nma-manage-container">
        <div className="nma-manage-top">
          <Link href="/admin/dashboard">
            <ArrowLeft size={17} />
            Dashboard
          </Link>
          <span>NUURMART ORDER OPERATIONS</span>
        </div>

        <div className="nma-manage-heading">
          <div>
            <span className="nma-overline">ORDER MANAGEMENT</span>
            <h1>Customer Orders</h1>
            <p>Review COD orders and update fulfillment status.</p>
          </div>
          <button type="button" onClick={() => void load()}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {error && (
          <p className="nma-manage-error" role="alert">{error}</p>
        )}

        {message && (
          <p className="nma-manage-success" role="status">{message}</p>
        )}

        {loading ? (
          <div className="nma-manage-panel">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="nma-manage-panel">
            No COD orders have been placed yet.
          </div>
        ) : (
          <div className="nmo-orders">
            {orders.map(order => (
              <article key={order._id} className="nmo-order">
                <div className="nmo-order-top">
                  <div>
                    <span>ORDER NUMBER</span>
                    <h2>{order.orderNumber}</h2>
                    <p>
                      {new Date(order.createdAt).toLocaleString("en-BD")}
                    </p>
                  </div>
                  <strong className="nmo-status">{order.status}</strong>
                </div>

                <div className="nmo-order-grid">
                  <div>
                    <h3>Customer & Delivery</h3>
                    <strong>{order.customer.name}</strong>
                    <p>{order.customer.phone}</p>
                    <p>{order.customer.district}</p>
                    <p>{order.customer.address}</p>
                    {order.customer.note && (
                      <p>Note: {order.customer.note}</p>
                    )}
                  </div>

                  <div>
                    <h3>Items</h3>
                    {order.items.map((item, i) => (
                      <p key={i}>
                        {item.name} × {item.quantity}
                        {" — "}
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    ))}
                  </div>

                  <div>
                    <h3>Payment</h3>
                    <p>Method: Cash on Delivery</p>
                    <p>Payment: {order.paymentStatus}</p>
                    <p>Subtotal: {formatPrice(order.subtotal)}</p>
                    <p>Delivery: {formatPrice(order.deliveryFee)}</p>
                    <strong>Total: {formatPrice(order.total)}</strong>
                  </div>
                </div>

                <div className="nmo-order-actions">
                  {nextStates[order.status].map(status => (
                    <button
                      key={status}
                      type="button"
                      disabled={updating !== null}
                      onClick={() => void changeStatus(order, status)}
                      className={
                        status === "cancelled" ? "nmo-cancel" : ""
                      }
                    >
                      <PackageCheck size={17} />
                      Mark {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
