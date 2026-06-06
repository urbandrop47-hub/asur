import { baseLayout } from "./base";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function campaignHtml(subject: string, body: string, recipientName: string): string {
  const safeBody = esc(body).replace(/\n/g, "<br/>");
  const safeSubject = esc(subject);
  return baseLayout(
    safeSubject,
    `<h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#fff;">${safeSubject}</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#ccc;">Hi ${recipientName},</p>
    <div style="font-size:15px;line-height:1.7;color:#ccc;">${safeBody}</div>
    <p style="margin:28px 0 0;font-size:13px;color:#555;">
      You are receiving this because you opted in to marketing emails from ASUR.
      <a href="${process.env.WEB_BASE_URL ?? "https://weareasur.in"}/account/notifications" style="color:#8b5cf6;">Manage preferences</a>
    </p>`
  );
}

export function campaignText(subject: string, body: string, recipientName: string): string {
  return `Hi ${recipientName},\n\n${body}\n\n---\nASUR · support@weareasur.in\nManage preferences: ${process.env.WEB_BASE_URL ?? "https://weareasur.in"}/account/notifications`;
}
