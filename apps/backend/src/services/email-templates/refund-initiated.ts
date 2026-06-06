import type { Return } from "@asur/types";
import { baseLayout, badge, h1, p, divider, kv } from "./base";

export function refundInitiatedHtml(ret: Return, customerName: string): string {
  const statusLabel = ret.status === "refunded" ? "Refund Initiated" : "Return Approved";
  const badgeColor = ret.status === "refunded" ? "#16a34a" : "#2563eb";

  const body = `
    ${badge(statusLabel, badgeColor)}
    <div style="margin-top:20px;">
      ${h1(`Good news, ${customerName} — your return has been ${ret.status === "refunded" ? "processed" : "approved"}!`)}
      ${ret.status === "refunded"
        ? p(`Your refund of <strong style="color:#e5e5e5;">₹${ret.refundAmount?.toLocaleString("en-IN") ?? "—"}</strong> has been initiated to your original payment method. It typically takes 5–7 business days to appear in your account.`)
        : p("Your return has been approved. The refund will be processed shortly.")
      }
    </div>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${kv("Return ID", ret.id)}
      ${kv("Order", `#${ret.orderNumber}`)}
      ${ret.refundAmount != null ? kv("Refund amount", `₹${ret.refundAmount.toLocaleString("en-IN")}`) : ""}
      ${ret.refundId ? kv("Refund reference", ret.refundId) : ""}
      ${ret.adminNote ? kv("Note", ret.adminNote) : ""}
    </table>
    ${divider()}
    ${p("If you have any questions, reply to this email or contact support@weareasur.in.")}
  `;

  return baseLayout(`${statusLabel} — #${ret.orderNumber}`, body);
}

export function refundInitiatedText(ret: Return, customerName: string): string {
  const statusLabel = ret.status === "refunded" ? "Refund Initiated" : "Return Approved";
  return `Hey ${customerName},

${statusLabel}!

Return ID: ${ret.id}
Order: #${ret.orderNumber}
${ret.refundAmount != null ? `Refund amount: ₹${ret.refundAmount.toLocaleString("en-IN")}\n` : ""}${ret.refundId ? `Refund reference: ${ret.refundId}\n` : ""}${ret.adminNote ? `Note: ${ret.adminNote}\n` : ""}
${ret.status === "refunded"
    ? "Your refund has been initiated. It typically takes 5–7 business days to appear in your account."
    : "Your return has been approved and the refund will be processed shortly."}

— ASUR`;
}
