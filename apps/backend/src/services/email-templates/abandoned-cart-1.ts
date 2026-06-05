import type { AbandonedCartDoc } from "../../models/abandoned-cart.model";

export function abandonedCart1Html(cart: AbandonedCartDoc, webBaseUrl: string): string {
  const recoveryUrl = `${webBaseUrl}/cart?recover=${cart.recoveryToken}`;
  const unsubUrl = `${webBaseUrl}/account/notifications`;
  const previewItems = cart.items.slice(0, 3);

  const itemsHtml = previewItems
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            ${
              item.imageUrl
                ? `<td width="60" style="padding-right:12px">
                <img src="${item.imageUrl}" width="56" height="56" style="border-radius:8px;object-fit:cover;display:block" alt="${item.productTitle}" />
              </td>`
                : ""
            }
            <td>
              <p style="margin:0;font-size:14px;font-weight:600;color:#f6f1ea">${item.productTitle}</p>
              <p style="margin:2px 0 0;font-size:12px;color:rgba(246,241,234,0.5)">${item.size} · ${item.color}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#f97316;font-weight:700">₹${item.unitPrice.toLocaleString("en-IN")} × ${item.quantity}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your cart misses you</title></head>
<body style="margin:0;padding:0;background:#0b0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0a0f;padding:32px 0">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background:#13121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#fb7185);padding:28px 32px">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(19,15,11,0.7)">ASUR</p>
              <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;color:#130f0b;letter-spacing:-0.02em">
                You left something behind
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px">
              <p style="margin:0 0 20px;font-size:15px;color:rgba(246,241,234,0.75);line-height:1.65">
                ${cart.customerName ? `Hey ${cart.customerName},<br><br>` : ""}Your cart is waiting. These pieces won't stick around forever — we run on limited stock.
              </p>

              <!-- Items -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px">
                ${itemsHtml}
              </table>

              ${
                cart.items.length > 3
                  ? `<p style="margin:0 0 20px;font-size:12px;color:rgba(246,241,234,0.4);text-align:center">+ ${cart.items.length - 3} more item${cart.items.length - 3 > 1 ? "s" : ""}</p>`
                  : ""
              }

              <p style="margin:0 0 8px;font-size:13px;color:rgba(246,241,234,0.4);text-align:right">
                Subtotal: <strong style="color:#f6f1ea">₹${cart.subtotal.toLocaleString("en-IN")}</strong>
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px">
                <tr>
                  <td align="center">
                    <a href="${recoveryUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#fb7185);color:#130f0b;font-weight:800;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:999px;letter-spacing:0.02em">
                      Complete Your Order
                    </a>
                  </td>
                </tr>
              </table>
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

export function abandonedCart1Text(cart: AbandonedCartDoc, webBaseUrl: string): string {
  const recoveryUrl = `${webBaseUrl}/cart?recover=${cart.recoveryToken}`;
  const lines = cart.items
    .slice(0, 3)
    .map((i) => `- ${i.productTitle} (${i.size}/${i.color}) × ${i.quantity} — ₹${i.unitPrice}`);
  return [
    cart.customerName ? `Hey ${cart.customerName},` : "Hey there,",
    "",
    "You left items in your ASUR cart:",
    ...lines,
    cart.items.length > 3 ? `...and ${cart.items.length - 3} more` : "",
    `Subtotal: ₹${cart.subtotal}`,
    "",
    `Complete your order → ${recoveryUrl}`,
    "",
    "– The ASUR team",
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}
