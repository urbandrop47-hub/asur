import type { AbandonedCartDoc } from "../../models/abandoned-cart.model";

export function abandonedCart2Html(cart: AbandonedCartDoc, couponCode: string, webBaseUrl: string): string {
  const recoveryUrl = `${webBaseUrl}/cart?recover=${cart.recoveryToken}&coupon=${couponCode}`;
  const unsubUrl = `${webBaseUrl}/account/notifications`;
  const previewItems = cart.items.slice(0, 3);

  const itemsHtml = previewItems
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
        <p style="margin:0;font-size:13px;color:#f6f1ea">${item.productTitle} — <span style="color:rgba(246,241,234,0.5)">${item.size} · ${item.color}</span></p>
        <p style="margin:2px 0 0;font-size:12px;color:#f97316">₹${item.unitPrice.toLocaleString("en-IN")} × ${item.quantity}</p>
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>5% off your cart</title></head>
<body style="margin:0;padding:0;background:#0b0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0a0f;padding:32px 0">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background:#13121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.07)">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(246,241,234,0.35)">ASUR · Last chance</p>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#f6f1ea;letter-spacing:-0.02em">
                Here's 5% off — just for you
              </h1>
            </td>
          </tr>

          <!-- Coupon badge -->
          <tr>
            <td style="padding:24px 32px;background:rgba(249,115,22,0.07);border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="margin:0 0 8px;font-size:12px;color:rgba(246,241,234,0.5);text-transform:uppercase;letter-spacing:0.12em">Your discount code</p>
              <p style="margin:0;font-size:26px;font-weight:900;color:#f97316;letter-spacing:0.08em;font-family:monospace">${couponCode}</p>
              <p style="margin:6px 0 0;font-size:12px;color:rgba(246,241,234,0.4)">5% off your order · Valid for 48 hours · One-time use</p>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:24px 32px">
              <p style="margin:0 0 16px;font-size:13px;color:rgba(246,241,234,0.5);text-transform:uppercase;letter-spacing:0.1em">Your cart</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px">
                ${itemsHtml}
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:rgba(246,241,234,0.4);text-align:right">
                Subtotal: <strong style="color:#f6f1ea">₹${cart.subtotal.toLocaleString("en-IN")}</strong>
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#f97316;text-align:right;font-weight:700">
                After 5% off: ₹${Math.round(cart.subtotal * 0.95).toLocaleString("en-IN")}
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${recoveryUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#fb7185);color:#130f0b;font-weight:800;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:999px">
                      Claim My 5% Off
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:12px;color:rgba(246,241,234,0.3);text-align:center">
                Code auto-applied at checkout. Limited stock — won't last.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06)">
              <p style="margin:0;font-size:11px;color:rgba(246,241,234,0.25);text-align:center;line-height:1.7">
                ASUR · Mumbai, India<br>
                <a href="${unsubUrl}" style="color:rgba(246,241,234,0.25);text-decoration:underline">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function abandonedCart2Text(cart: AbandonedCartDoc, couponCode: string, webBaseUrl: string): string {
  const recoveryUrl = `${webBaseUrl}/cart?recover=${cart.recoveryToken}&coupon=${couponCode}`;
  return [
    cart.customerName ? `Hey ${cart.customerName},` : "Hey there,",
    "",
    "Your cart is still waiting — here's 5% off to help you decide.",
    "",
    `Your discount code: ${couponCode}`,
    "Valid 48 hours · One-time use",
    "",
    `Complete your order → ${recoveryUrl}`,
    "",
    "– The ASUR team",
  ].join("\n");
}
