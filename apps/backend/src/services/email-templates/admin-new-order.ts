import type { Order } from "@asur/types";
import { baseLayout, badge, divider, h1, kv, p } from "./base";

export function adminNewOrderHtml(order: Order, customerEmail: string): string {
  const itemList = order.items
    .map((i) => `<li style="margin-bottom:4px;">${i.title} (${i.variantSku}) × ${i.quantity} — ₹${i.totalPrice}</li>`)
    .join("");

  const body = `
    ${badge("New Paid Order", "#d97706")}
    <div style="margin-top:20px;">
      ${h1(`New order: #${order.orderNumber}`)}
      ${p(`A paid order has landed. Total: <strong style="color:#e5e5e5;">₹${order.total.toLocaleString("en-IN")}</strong>.`)}
    </div>
    ${divider()}
    <table cellpadding="0" cellspacing="0">
      ${kv("Order Number", `#${order.orderNumber}`)}
      ${kv("Customer", customerEmail)}
      ${kv("Total", `₹${order.total.toLocaleString("en-IN")}`)}
      ${kv("Ship to", `${order.shippingAddress.city}, ${order.shippingAddress.state}`)}
    </table>
    ${divider()}
    <div style="font-size:13px;color:#a3a3a3;margin-bottom:4px;font-weight:600;">Items</div>
    <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#a3a3a3;line-height:1.8;">
      ${itemList}
    </ul>
  `;

  return baseLayout(`[ASUR OPS] New Order #${order.orderNumber}`, body);
}

export function adminNewOrderText(order: Order, customerEmail: string): string {
  const items = order.items.map((i) => `  ${i.title} (${i.variantSku}) × ${i.quantity} — ₹${i.totalPrice}`).join("\n");
  return `[ASUR OPS] New paid order: #${order.orderNumber}

Customer: ${customerEmail}
Total: ₹${order.total}
Ship to: ${order.shippingAddress.city}, ${order.shippingAddress.state}

Items:
${items}
`;
}
