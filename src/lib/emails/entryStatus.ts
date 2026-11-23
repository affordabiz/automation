import { escapeHtml } from "./escape";
import { emailLayout, type EmailContent } from "./layout";

export function entryReceivedEmail(p: { fullName: string; businessName: string }): EmailContent {
  const html = emailLayout(
    "We received your request",
    `<p>Hi ${escapeHtml(p.fullName)},</p>
<p>Thanks for submitting the details for <strong>${escapeHtml(p.businessName)}</strong>.</p>
<p>Our team will review your webpage. Once it's approved, we'll email you the link.</p>`,
  );
  const text = `Hi ${p.fullName},

Thanks for submitting the details for ${p.businessName}.

Our team will review your webpage. Once it's approved, we'll email you the link.`;
  return { subject: `We received your request — ${p.businessName}`, html, text };
}

export function entryMessageEmail(p: { fullName: string; businessName: string; message: string }): EmailContent {
  const message = escapeHtml(p.message).replace(/\r?\n/g, "<br>");
  const html = emailLayout(
    "A message about your webpage",
    `<p>Hi ${escapeHtml(p.fullName)},</p>
<p style="background:#f4f6f5;border-radius:8px;padding:12px 16px">${message}</p>
<p>You can reply directly to this email.</p>`,
  );
  const text = `Hi ${p.fullName},

${p.message}

You can reply directly to this email.`;
  return { subject: `A message about your webpage — ${p.businessName}`, html, text };
}
