import type { Order, Payment } from "@asur/types";
import { baseLayout, badge, divider, h1, kv, p } from "./base";

export function paymentReceiptHtml(order: Order, payment: Payment, customerName: string): string {
  const body = `
    ${badge("Payment Received", "#16a34a")}
    <div style="margin-top:20px;">
      ${h1(`Payment confirmed, ${customerName}!`)}
      ${p(`Your payment of <strong style="color:#e5e5e5;">₹${order.total.toLocaleString("en-IN")}</strong> for order <strong style="color:#e5e5e5;">#${order.orderNumber}</strong> has been received. We're packing your drop now.`)}
    </div>
    ${divider()}
    <table cellpadding="0" cellspacing="0">
      ${kv("Order", `#${order.orderNumber}`)}
      ${kv("Amount Paid", `₹${order.total.toLocaleString("en-IN")}`)}
      ${kv("Payment ID", payment.providerPaymentId ?? "—")}
      ${kv("Provider Order ID", payment.providerOrderId ?? "—")}
      ${kv("Status", "Captured")}
    </table>
    ${divider()}
    ${p("Keep this email as your receipt. You'll get another email when your order ships.")}
  `;

  return baseLayout(`Payment Receipt — #${order.orderNumber}`, body);
}

export function paymentReceiptText(order: Order, payment: Payment, customerName: string): string {
  return `Hey ${customerName},

Payment of ₹${order.total} for order #${order.orderNumber} confirmed.

Payment ID: ${payment.providerPaymentId ?? "—"}
Provider Order ID: ${payment.providerOrderId ?? "—"}

Keep this as your receipt. You'll hear from us when it ships.

ASUR
`;
}
