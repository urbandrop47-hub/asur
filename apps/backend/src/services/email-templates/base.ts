export function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Logo / Brand -->
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;">
              <span style="font-size:28px;font-weight:900;letter-spacing:0.15em;color:#ffffff;text-transform:uppercase;">ASUR</span>
              <div style="font-size:11px;letter-spacing:0.2em;color:#666;margin-top:4px;">NEITHER DIVINE. NOR DAMNED.</div>
            </td>
          </tr>
          <!-- Body Card -->
          <tr>
            <td style="background:#161616;border:1px solid #262626;border-radius:8px;padding:40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;text-align:center;font-size:12px;color:#555;line-height:1.6;">
              ASUR · India's premium streetwear drop label<br/>
              Questions? Reply to this email or contact us at support@weareasur.in
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function h1(text: string): string {
  return `<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">${text}</h1>`;
}

export function p(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#a3a3a3;">${text}</p>`;
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid #262626;margin:24px 0;" />`;
}

export function badge(text: string, color = "#7c3aed"): string {
  return `<span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:3px 10px;border-radius:4px;">${text}</span>`;
}

export function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#7c3aed;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;margin-top:8px;">${text}</a>`;
}

export function kv(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#666;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:8px 0 8px 16px;font-size:13px;color:#e5e5e5;font-weight:500;">${value}</td>
  </tr>`;
}
