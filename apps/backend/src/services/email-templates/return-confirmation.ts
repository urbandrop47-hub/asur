import type { Return, Order } from "@asur/types";
import { baseLayout, badge, h1, p, divider, kv } from "./base";

export function returnConfirmationHtml(ret: Return, order: Order, customerName: string): string {
  const itemRows = ret.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;font-size:14px;color:#e5e5e5;border-bottom:1px solid #262626;">
            ${item.variantSku}
            <div style="font-size:12px;color:#666;margin-top:2px;">Qty: ${item.quantity} · ${item.reason}</div>
          </td>
        </tr>`
    )
    .join("");

  const body = `
    ${badge("Return Requested", "#dc2626")}
    <div style="margin-top:20px;">
      ${h1(`Hey ${customerName}, we've received your return request.`)}
      ${p(`Your return request for order <strong style="color:#e5e5e5;">#${order.orderNumber}</strong> has been submitted. Our team will review it within 1–2 business days.`)}
    </div>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding:4px 0 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#666;">Return items</td>
      </tr>
      ${itemRows}
    </table>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${kv("Return ID", ret.id)}
      ${kv("Order", `#${order.orderNumber}`)}
      ${kv("Reason", ret.reason)}
      ${kv("Status", "Under review")}
    </table>
    ${divider()}
    ${p("Once approved, your refund will be processed to the original payment method within 5–7 business days.")}
  `;

  return baseLayout(`Return Request — #${order.orderNumber}`, body);
}

export function returnConfirmationText(ret: Return, order: Order, customerName: string): string {
  const items = ret.items.map((i) => `  • ${i.variantSku} × ${i.quantity} — ${i.reason}`).join("\n");
  return `Hey ${customerName},

We've received your return request for order #${order.orderNumber}.

Return ID: ${ret.id}
Reason: ${ret.reason}

Items:
${items}

Our team will review it within 1–2 business days. Once approved, your refund will be processed within 5–7 business days.

— ASUR`;
}
