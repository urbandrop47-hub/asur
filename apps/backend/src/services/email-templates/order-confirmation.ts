import type { Order } from "@asur/types";
import { baseLayout, badge, button, divider, h1, kv, p } from "./base";

export function orderConfirmationHtml(order: Order, customerName: string): string {
  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;font-size:14px;color:#e5e5e5;border-bottom:1px solid #262626;">
            ${item.title}
            <div style="font-size:12px;color:#666;margin-top:2px;">SKU: ${item.variantSku} × ${item.quantity}</div>
          </td>
          <td style="padding:10px 0;font-size:14px;color:#e5e5e5;text-align:right;border-bottom:1px solid #262626;">
            ₹${item.totalPrice.toLocaleString("en-IN")}
          </td>
        </tr>`
    )
    .join("");

  const body = `
    ${badge("Order Confirmed")}
    <div style="margin-top:20px;">
      ${h1(`Hey ${customerName}, your order is confirmed!`)}
      ${p(`We've received your order <strong style="color:#e5e5e5;">#${order.orderNumber}</strong>. Payment is pending — once we receive it, we'll start packing your drop.`)}
    </div>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${itemRows}
    </table>
    ${divider()}
    <table cellpadding="0" cellspacing="0">
      ${kv("Subtotal", `₹${order.subtotal.toLocaleString("en-IN")}`)}
      ${(order.discount ?? 0) > 0 ? kv("Discount" + (order.couponCode ? ` (${order.couponCode})` : ""), `−₹${(order.discount ?? 0).toLocaleString("en-IN")}`) : ""}
      ${kv("Shipping", order.shipping === 0 ? "Free" : `₹${order.shipping.toLocaleString("en-IN")}`)}
      ${kv("GST (18%)", `₹${order.tax.toLocaleString("en-IN")}`)}
      ${kv("Total", `₹${order.total.toLocaleString("en-IN")}`)}
    </table>
    ${divider()}
    <div style="font-size:13px;color:#666;">
      <strong style="color:#a3a3a3;">Shipping to:</strong><br/>
      ${order.shippingAddress.fullName}<br/>
      ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ", " + order.shippingAddress.line2 : ""}<br/>
      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
    </div>
  `;

  return baseLayout(`Order Confirmed — #${order.orderNumber}`, body);
}

export function orderConfirmationText(order: Order, customerName: string): string {
  const items = order.items
    .map((i) => `  ${i.title} (${i.variantSku}) × ${i.quantity} — ₹${i.totalPrice}`)
    .join("\n");
  return `Hey ${customerName},

Your ASUR order #${order.orderNumber} is confirmed!

Items:
${items}

Subtotal: ₹${order.subtotal}
Shipping: ${order.shipping === 0 ? "Free" : "₹" + order.shipping}
GST (18%): ₹${order.tax}
Total: ₹${order.total}

Shipping to: ${order.shippingAddress.fullName}, ${order.shippingAddress.line1}, ${order.shippingAddress.city} ${order.shippingAddress.postalCode}

Thanks for shopping ASUR.
`;
}
