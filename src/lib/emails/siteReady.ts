import { escapeHtml } from "./escape";
import { emailLayout, type EmailContent } from "./layout";

export function siteReadyEmail(p: { fullName: string; businessName: string; url: string }): EmailContent {
  const url = escapeHtml(p.url);
  const html = emailLayout(
    "Your webpage is ready",
    `<p>Hi ${escapeHtml(p.fullName)},</p>
<p>Great news — the webpage for <strong>${escapeHtml(p.businessName)}</strong> is live.</p>
<p style="margin:28px 0"><a href="${url}" style="background:#F7931E;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">View your webpage</a></p>
<p>Or copy this link: <a href="${url}" style="color:#0E5A4E">${url}</a></p>
<p>Messages sent through your webpage's contact form will arrive at this email address.</p>`,
  );
  const text = `Hi ${p.fullName},

The webpage for ${p.businessName} is live: ${p.url}

Messages sent through your webpage's contact form will arrive at this email address.`;
  return { subject: `Your webpage is ready — ${p.businessName}`, html, text };
}
