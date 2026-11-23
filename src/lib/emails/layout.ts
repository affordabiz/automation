import { escapeHtml } from "./escape";

export interface EmailContent { subject: string; html: string; text: string }

/** `bodyHtml` must already be escaped. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#1f2933">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0E5A4E;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold">${escapeHtml(title)}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;background:#EAF3F0;font-size:12px;color:#52606d">Sent by Affordabiz</td></tr>
</table></td></tr></table></body></html>`;
}
