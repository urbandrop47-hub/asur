"use client";

import { Button, MetricCard, Pill } from "@asur/ui";
import { formatCurrency } from "@asur/utils";
import { useCartStore } from "../../store/cart-store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const subtotal = useCartStore((state) => state.subtotal());

  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>Cart</h1>
          <p>Keep the cart state tiny, predictable, and ready to hand off to checkout.</p>
        </div>
        <div className="actions">
          <Button href="/checkout">Checkout</Button>
          <Button variant="ghost" onClick={clear}>
            Clear cart
          </Button>
        </div>
      </div>

      <div className="grid-2">
        <MetricCard label="Items" value={String(items.length)} detail="Zustand holds the cart locally until checkout." />
        <MetricCard label="Subtotal" value={formatCurrency(subtotal)} detail="Shipping and taxes are added in the backend." />
      </div>

      <div className="grid-2">
        {items.map((item) => (
          <article key={item.variantSku} className="table-card">
            <div className="body stack">
              <Pill tone="info">{item.variantSku}</Pill>
              <strong>{item.productId}</strong>
              <p>Quantity {item.quantity}</p>
              <p>{formatCurrency(item.unitPrice)} each</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
