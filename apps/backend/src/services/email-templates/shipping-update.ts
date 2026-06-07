import type { Order, VendorTask } from "@asur/types";
import { getCourierTrackingUrl } from "@asur/constants";
import { baseLayout, badge, button, divider, h1, kv, p } from "./base";

export function shippingUpdateHtml(order: Order, task: VendorTask, customerName: string, webBaseUrl: string): string {
  const trackingUrl = task.courierName && task.trackingId
    ? (getCourierTrackingUrl(task.courierName, task.trackingId) ??
       `https://www.google.com/search?q=${encodeURIComponent(task.courierName + " tracking " + task.trackingId)}`)
    : null;

  const body = `
    ${badge("Your Order Has Shipped!", "#0891b2")}
    <div style="margin-top:20px;">
      ${h1(`It's on its way, ${customerName}!`)}
      ${p(`Your ASUR order <strong style="color:#e5e5e5;">#${order.orderNumber}</strong> has been dispatched and is headed to you.`)}
    </div>
    ${divider()}
    <table cellpadding="0" cellspacing="0">
      ${kv("Order", `#${order.orderNumber}`)}
      ${task.courierName ? kv("Courier", task.courierName) : ""}
      ${task.trackingId ? kv("Tracking ID", task.trackingId) : ""}
      ${kv("Shipping to", `${order.shippingAddress.fullName}, ${order.shippingAddress.city} ${order.shippingAddress.postalCode}`)}
    </table>
    ${divider()}
    ${trackingUrl ? button("Track Your Order", trackingUrl) : ""}
    <div style="margin-top:24px;">
      ${p("Delivery usually takes 3–7 business days. Reach out if you have any questions.")}
    </div>
  `;

  return baseLayout(`Your ASUR Order Has Shipped — #${order.orderNumber}`, body);
}

export function shippingUpdateText(order: Order, task: VendorTask, customerName: string): string {
  return `Hey ${customerName},

Your ASUR order #${order.orderNumber} has shipped!

Courier: ${task.courierName ?? "—"}
Tracking ID: ${task.trackingId ?? "—"}
Delivering to: ${order.shippingAddress.fullName}, ${order.shippingAddress.city} ${order.shippingAddress.postalCode}

Delivery usually takes 3–7 business days.

ASUR
`;
}
