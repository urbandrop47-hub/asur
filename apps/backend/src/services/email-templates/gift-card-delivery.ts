export function giftCardDeliveryHtml(params: {
  recipientName: string;
  senderName: string;
  code: string;
  amount: number;
  message?: string;
  expiresAt: string;
  webBaseUrl: string;
}): string {
  const formatted = params.code.match(/.{1,4}/g)?.join("-") ?? params.code;
  const expiry = params.expiresAt
    ? new Date(params.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Never";
  const msgBlock = params.message
    ? `<p style="margin:0 0 20px;padding:16px;background:#1a1a2e;border-left:3px solid #f97316;border-radius:4px;font-style:italic;color:#ccc;">"${params.message}"</p>`
    : "";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your ASUR Gift Card</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,sans-serif;color:#f6f1ea;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;background:linear-gradient(135deg,#f97316,#fb7185);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ASUR</h1>
  <p style="margin:0 0 32px;font-size:13px;color:#888;">weareasur.in</p>

  <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;">You've received a gift card!</h2>
  <p style="margin:0 0 24px;color:#aaa;">${params.senderName} sent you an ASUR gift card worth <strong style="color:#f6f1ea;">₹${params.amount}</strong>.</p>

  ${msgBlock}

  <div style="background:linear-gradient(135deg,rgba(249,115,22,0.15),rgba(251,113,133,0.1));border:1px solid rgba(249,115,22,0.3);border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
    <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">Your gift card code</p>
    <p style="margin:0 0 8px;font-size:28px;font-weight:900;letter-spacing:0.15em;font-family:monospace;color:#f97316;">${formatted}</p>
    <p style="margin:0;font-size:13px;color:#888;">Balance: ₹${params.amount} · Expires: ${expiry}</p>
  </div>

  <p style="margin:0 0 24px;color:#aaa;font-size:14px;">Enter this code at checkout on <a href="${params.webBaseUrl}" style="color:#f97316;">${params.webBaseUrl.replace(/^https?:\/\//, "")}</a> to apply it to your order.</p>

  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 24px;">
  <p style="margin:0;font-size:12px;color:#555;">Gift cards cannot be exchanged for cash. For help, contact us at support@asur.in.</p>
</div>
</body>
</html>`;
}

export function giftCardDeliveryText(params: {
  recipientName: string;
  senderName: string;
  code: string;
  amount: number;
  message?: string;
  expiresAt: string;
  webBaseUrl: string;
}): string {
  const formatted = params.code.match(/.{1,4}/g)?.join("-") ?? params.code;
  const expiry = params.expiresAt
    ? new Date(params.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Never";
  return [
    "ASUR Gift Card",
    "",
    `Hi ${params.recipientName},`,
    "",
    `${params.senderName} sent you an ASUR gift card worth ₹${params.amount}.`,
    ...(params.message ? [`"${params.message}"`, ""] : [""]),
    `Your gift card code: ${formatted}`,
    `Balance: ₹${params.amount}`,
    `Expires: ${expiry}`,
    "",
    `Enter this code at checkout on ${params.webBaseUrl}`,
    "",
    "Gift cards cannot be exchanged for cash. For help, contact us at support@asur.in."
  ].join("\n");
}
