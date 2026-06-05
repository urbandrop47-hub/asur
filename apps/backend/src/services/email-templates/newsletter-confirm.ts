export function newsletterConfirmHtml(confirmUrl: string, webBaseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your subscription</title></head>
<body style="margin:0;padding:0;background:#0b0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0a0f;padding:32px 0">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="480" style="max-width:480px;width:100%;background:#13121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#fb7185);padding:24px 32px">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(19,15,11,0.7)">ASUR</p>
              <h1 style="margin:6px 0 0;font-size:20px;font-weight:800;color:#130f0b">
                One click to confirm
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px">
              <p style="margin:0 0 20px;font-size:15px;color:rgba(246,241,234,0.75);line-height:1.65">
                You're almost in. Confirm your email to receive drop alerts, exclusive offers, and first-access invites from ASUR.
              </p>

              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#fb7185);color:#130f0b;font-weight:800;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:999px">
                      Confirm My Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:12px;color:rgba(246,241,234,0.3);text-align:center;line-height:1.7">
                If you didn't sign up, you can ignore this email.<br>
                Link expires in 7 days.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06)">
              <p style="margin:0;font-size:11px;color:rgba(246,241,234,0.25);text-align:center">
                ASUR · Mumbai, India · <a href="${webBaseUrl}" style="color:rgba(246,241,234,0.25);text-decoration:underline">asur.in</a>
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

export function newsletterConfirmText(confirmUrl: string): string {
  return [
    "Hey there,",
    "",
    "Thanks for subscribing to ASUR updates!",
    "",
    "Please confirm your email by clicking the link below:",
    confirmUrl,
    "",
    "If you didn't sign up, you can safely ignore this email.",
    "",
    "– The ASUR team",
  ].join("\n");
}
