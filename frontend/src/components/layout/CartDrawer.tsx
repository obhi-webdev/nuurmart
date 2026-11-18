"use client";
import Image from "next/image";


import { ShoppingBag, Trash2, X } from "lucide-react";
import {
  formatPrice,
  products,
} from "@/features/products/catalog";
import type { CartItem } from "@/features/cart/use-cart";

type Props = {
  open: boolean;
  items: CartItem[];
  subtotal: number;
  onClose: () => void;
  onRemove: (id: string) => void;
  onQuantity: (id: string, delta: number) => void;
};

export function CartDrawer({
  open,
  items,
  subtotal,
  onClose,
  onRemove,
  onQuantity,
}: Props) {
  if (!open) return null;

  return (
    <div className="nm-cart-overlay" onMouseDown={onClose}>
      <aside
        className="nm-cart-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="nm-cart-heading">
          <div>
            <span className="nm-eyebrow">YOUR SELECTION</span>
            <h2>Shopping Bag</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close cart">
            <X />
          </button>
        </div>

        <div className="nm-cart-content">
          {items.length === 0 ? (
            <div className="nm-cart-empty">
              <ShoppingBag size={44} strokeWidth={1.1} />
              <h3>Your bag is waiting.</h3>
              <p>Discover something naturally wonderful.</p>
              <button className="nm-btn nm-btn-dark" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => {
              const product = products.find(
                (p) => p.id === item.productId
              );
              if (!product) return null;

              return (
                <div className="nm-cart-line" key={product.id}>
                  <div className="nm-cart-line-art nm3-cart-photo">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="95px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="nm-cart-line-info">
                    <h3>{product.name}</h3>
                    <p>{product.unit}</p>
                    <strong>
                      {formatPrice(product.price * item.quantity)}
                    </strong>
                    <div className="nm-quantity">
                      <button
                        onClick={() => onQuantity(product.id, -1)}
                        aria-label={`Decrease ${product.name}`}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => onQuantity(product.id, 1)}
                        aria-label={`Increase ${product.name}`}
                        disabled={item.quantity >= 99}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="nm-cart-remove"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Remove ${product.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="nm-cart-footer">
            <div className="nm-cart-total">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <p>Shipping will be calculated at checkout.</p>
            <div className="nm-checkout-notice">
              Checkout is coming in a later development phase.
              No orders are being placed yet.
            </div>
            <button className="nm-btn nm-btn-dark" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
