import { Resend } from "resend";
import { env, hasResendCredentials } from "../config/env";
import type { Order, Payment, VendorTask } from "@asur/types";
import { adminNewOrderHtml, adminNewOrderText } from "./email-templates/admin-new-order";
import { orderConfirmationHtml, orderConfirmationText } from "./email-templates/order-confirmation";
import { paymentReceiptHtml, paymentReceiptText } from "./email-templates/payment-receipt";
import { shippingUpdateHtml, shippingUpdateText } from "./email-templates/shipping-update";

const FROM_ADDRESS = "ASUR <noreply@asur.in>";
const WEB_BASE_URL = process.env.WEB_BASE_URL ?? "https://asur.in";

let resend: Resend | null = null;
if (hasResendCredentials) {
  resend = new Resend(env.RESEND_API_KEY);
}

interface SendParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

// Fire-and-forget email send. A failed send is logged but never throws —
// it must never break the calling payment or order flow.
async function queueEmail(params: SendParams): Promise<void> {
  if (!resend) {
    console.log("[email] Resend not configured — skipping send to:", params.to, "| subject:", params.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text
    });
    if (error) {
      console.error("[email] Resend API error:", error);
    }
  } catch (err) {
    console.error("[email] Unexpected error sending email:", err);
  }
}

export async function sendOrderConfirmationEmail(order: Order, customerEmail: string, customerName: string): Promise<void> {
  await queueEmail({
    to: customerEmail,
    subject: `Order Confirmed — #${order.orderNumber}`,
    html: orderConfirmationHtml(order, customerName),
    text: orderConfirmationText(order, customerName)
  });
}

export async function sendPaymentReceiptEmail(order: Order, payment: Payment, customerEmail: string, customerName: string): Promise<void> {
  await queueEmail({
    to: customerEmail,
    subject: `Payment Receipt — #${order.orderNumber}`,
    html: paymentReceiptHtml(order, payment, customerName),
    text: paymentReceiptText(order, payment, customerName)
  });
}

export async function sendShippingUpdateEmail(order: Order, task: VendorTask, customerEmail: string, customerName: string): Promise<void> {
  await queueEmail({
    to: customerEmail,
    subject: `Your Order Has Shipped — #${order.orderNumber}`,
    html: shippingUpdateHtml(order, task, customerName, WEB_BASE_URL),
    text: shippingUpdateText(order, task, customerName)
  });
}

export async function sendAdminNewOrderEmail(order: Order, customerEmail: string): Promise<void> {
  const adminEmail = env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log("[email] ADMIN_EMAIL not set — skipping admin new-order notification");
    return;
  }
  await queueEmail({
    to: adminEmail,
    subject: `[ASUR OPS] New Order #${order.orderNumber}`,
    html: adminNewOrderHtml(order, customerEmail),
    text: adminNewOrderText(order, customerEmail)
  });
}
