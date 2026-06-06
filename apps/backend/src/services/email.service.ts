import { Resend } from "resend";
import { env, hasResendCredentials } from "../config/env";
import type { Order, Payment, VendorTask } from "@asur/types";
import type { Return } from "../shared/types";
import { adminNewOrderHtml, adminNewOrderText } from "./email-templates/admin-new-order";
import { orderConfirmationHtml, orderConfirmationText } from "./email-templates/order-confirmation";
import { paymentReceiptHtml, paymentReceiptText } from "./email-templates/payment-receipt";
import { shippingUpdateHtml, shippingUpdateText } from "./email-templates/shipping-update";
import { returnConfirmationHtml, returnConfirmationText } from "./email-templates/return-confirmation";
import { refundInitiatedHtml, refundInitiatedText } from "./email-templates/refund-initiated";
import { giftCardDeliveryHtml, giftCardDeliveryText } from "./email-templates/gift-card-delivery";
import { abandonedCart1Html, abandonedCart1Text } from "./email-templates/abandoned-cart-1";
import { abandonedCart2Html, abandonedCart2Text } from "./email-templates/abandoned-cart-2";
import { newsletterConfirmHtml, newsletterConfirmText } from "./email-templates/newsletter-confirm";
import type { AbandonedCartDoc } from "../models/abandoned-cart.model";

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

export async function sendGiftCardEmail(params: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  code: string;
  amount: number;
  message?: string;
  expiresAt: string;
}): Promise<void> {
  await queueEmail({
    to: params.recipientEmail,
    subject: `You've received a ₹${params.amount} ASUR Gift Card!`,
    html: giftCardDeliveryHtml({ ...params, webBaseUrl: WEB_BASE_URL }),
    text: giftCardDeliveryText({ ...params, webBaseUrl: WEB_BASE_URL })
  });
}

export async function sendLowStockAlertEmail(productTitle: string, sku: string, remaining: number): Promise<void> {
  const adminEmail = env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const html = `
    <h2 style="font-family:sans-serif">⚠️ Low Stock Alert</h2>
    <p style="font-family:sans-serif"><strong>${productTitle}</strong> (SKU: ${sku}) is running low.</p>
    <p style="font-family:sans-serif">Units remaining: <strong>${remaining}</strong></p>
    <p style="font-family:sans-serif">Log in to the <a href="${WEB_BASE_URL}/admin/inventory">admin inventory panel</a> to restock.</p>
  `;
  const text = `Low Stock Alert: ${productTitle} (${sku}) — ${remaining} units left. Restock at ${WEB_BASE_URL}/admin/inventory`;
  await queueEmail({
    to: adminEmail,
    subject: `[ASUR OPS] Low Stock: ${productTitle} (${sku}) — ${remaining} left`,
    html,
    text
  });
}

export async function sendReturnConfirmationEmail(ret: Return, order: Order, customerEmail: string, customerName: string): Promise<void> {
  await queueEmail({
    to: customerEmail,
    subject: `Return Request Received — #${order.orderNumber}`,
    html: returnConfirmationHtml(ret, order, customerName),
    text: returnConfirmationText(ret, order, customerName)
  });
}

export async function sendRefundInitiatedEmail(ret: Return, customerEmail: string, customerName: string): Promise<void> {
  const subject = ret.status === "refunded"
    ? `Refund Initiated — #${ret.orderNumber}`
    : `Return Approved — #${ret.orderNumber}`;
  await queueEmail({
    to: customerEmail,
    subject,
    html: refundInitiatedHtml(ret, customerName),
    text: refundInitiatedText(ret, customerName)
  });
}

export async function sendAbandonedCartEmail1(cart: AbandonedCartDoc): Promise<void> {
  await queueEmail({
    to: cart.email,
    subject: "You left something in your cart — it's waiting for you",
    html: abandonedCart1Html(cart, WEB_BASE_URL),
    text: abandonedCart1Text(cart, WEB_BASE_URL),
  });
}

export async function sendAbandonedCartEmail2(cart: AbandonedCartDoc, couponCode: string): Promise<void> {
  await queueEmail({
    to: cart.email,
    subject: `Here's 5% off your ASUR cart — code: ${couponCode}`,
    html: abandonedCart2Html(cart, couponCode, WEB_BASE_URL),
    text: abandonedCart2Text(cart, couponCode, WEB_BASE_URL),
  });
}

export async function sendNewsletterConfirmEmail(email: string, confirmToken: string): Promise<void> {
  // Confirm link points to the Next.js frontend page which calls the backend API.
  // This avoids Next.js routing the /api/v1/... path (which it doesn't own).
  const confirmUrl = `${WEB_BASE_URL}/newsletter/confirm?token=${confirmToken}`;
  await queueEmail({
    to: email,
    subject: "Confirm your ASUR subscription",
    html: newsletterConfirmHtml(confirmUrl, WEB_BASE_URL),
    text: newsletterConfirmText(confirmUrl),
  });
}

export async function sendBackInStockEmail(
  productTitle: string,
  productSlug: string,
  sku: string,
  size: string,
  color: string,
  customerEmail: string
): Promise<void> {
  const url = `${WEB_BASE_URL}/products/${productSlug}`;
  const html = `
    <h2 style="font-family:sans-serif">✅ Back in Stock!</h2>
    <p style="font-family:sans-serif"><strong>${productTitle}</strong> (${size} / ${color}) is available again.</p>
    <p style="font-family:sans-serif">
      <a href="${url}" style="background:#f97316;color:#130f0b;padding:10px 24px;border-radius:999px;text-decoration:none;font-weight:700">
        Shop now
      </a>
    </p>
    <p style="font-family:sans-serif;font-size:12px;color:#888">SKU: ${sku}</p>
  `;
  const text = `${productTitle} (${size} / ${color}) is back in stock! Shop now: ${url}`;
  await queueEmail({
    to: customerEmail,
    subject: `✅ Back in stock: ${productTitle} (${size} / ${color})`,
    html,
    text
  });
}

export async function sendReviewRequestEmail(
  order: { orderNumber: string; items: Array<{ title: string }> },
  customerEmail: string,
  customerName: string
): Promise<void> {
  const productList = order.items.map((i) => `• ${i.title}`).join("\n");
  const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#06070b;color:#f6f1ea;padding:32px">
    <p style="font-size:22px;font-weight:800;margin:0 0 8px;color:#f97316">ASUR</p>
    <h1 style="font-size:18px;font-weight:700;margin:0 0 20px">How did we do?</h1>
    <p style="font-size:14px;color:rgba(246,241,234,0.75);line-height:1.6">
      Hi ${customerName}, your order <strong>#${order.orderNumber}</strong> arrived a week ago.
      We'd love to hear what you think of your pieces.
    </p>
    <p style="font-size:13px;color:rgba(246,241,234,0.5);line-height:1.6">${productList.replace(/\n/g, "<br>")}</p>
    <a href="${WEB_BASE_URL}/orders" style="display:inline-block;margin:20px 0;padding:12px 28px;border-radius:999px;background:linear-gradient(135deg,#f97316,#fb7185);color:#130f0b;font-weight:700;font-size:14px;text-decoration:none">
      Write a review
    </a>
    <p style="font-size:12px;color:rgba(246,241,234,0.4);line-height:1.6;margin-top:24px">
      Your honest feedback helps us improve every drop.
    </p>
  </div>`;
  const text = `Hi ${customerName},\n\nYour ASUR order #${order.orderNumber} arrived a week ago. Share your thoughts:\n\n${productList}\n\nReview at: ${WEB_BASE_URL}/orders\n\n— ASUR`;
  await queueEmail({
    to: customerEmail,
    subject: `How was your ASUR order? #${order.orderNumber}`,
    html,
    text
  });
}
