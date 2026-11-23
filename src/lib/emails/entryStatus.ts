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

export function entryRejectedEmail(p: { fullName: string; businessName: string; reason: string }): EmailContent {
  const reason = escapeHtml(p.reason).replace(/\r?\n/g, "<br>");
  const html = emailLayout(
    "An update on your webpage request",
    `<p>Hi ${escapeHtml(p.fullName)},</p>
<p>We reviewed the request for <strong>${escapeHtml(p.businessName)}</strong> and can't publish it at this time.</p>
<p style="background:#f4f6f5;border-radius:8px;padding:12px 16px"><strong>Reason:</strong><br>${reason}</p>
<p>You're welcome to submit a new request with updated details.</p>`,
  );
  const text = `Hi ${p.fullName},

We reviewed the request for ${p.businessName} and can't publish it at this time.

Reason:
${p.reason}

You're welcome to submit a new request with updated details.`;
  return { subject: `An update on your webpage request — ${p.businessName}`, html, text };
}
