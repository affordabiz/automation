import { escapeHtml } from "./escape";
import { emailLayout, type EmailContent } from "./layout";

const button = (url: string, label: string) =>
  `<p style="margin:28px 0"><a href="${escapeHtml(url)}" style="background:#F7931E;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">${escapeHtml(label)}</a></p>`;

const greeting = (name: string | null) => (name ? `Hi ${name},` : "Hi,");

export function paymentReceivedEmail(p: {
  name: string | null;
  productName: string;
  amount: string;
  formUrl: string;
  invoiceUrl: string | null;
}): EmailContent {
  const invoiceHtml = p.invoiceUrl
    ? `<p>Your invoice: <a href="${escapeHtml(p.invoiceUrl)}" style="color:#0E5A4E">view or download it here</a>.</p>`
    : "";
  const html = emailLayout(
    "Payment received",
    `<p>${escapeHtml(greeting(p.name))}</p>
<p>Thank you for your payment of <strong>${escapeHtml(p.amount)}</strong> for <strong>${escapeHtml(p.productName)}</strong>.</p>
${invoiceHtml}
<p>If you haven't filled in your webpage details yet, use the button below. Your webpage goes live as soon as you submit the form.</p>
${button(p.formUrl, "Fill in your webpage details")}
<p>Or copy this link: <a href="${escapeHtml(p.formUrl)}" style="color:#0E5A4E">${escapeHtml(p.formUrl)}</a></p>
<p style="font-size:13px;color:#52606d">This link is personal and works once. Please don't share it.</p>`,
  );
  const text = `${greeting(p.name)}

Thank you for your payment of ${p.amount} for ${p.productName}.
${p.invoiceUrl ? `\nYour invoice: ${p.invoiceUrl}\n` : ""}
If you haven't filled in your webpage details yet, use this link. Your webpage goes live as soon as you submit the form:
${p.formUrl}

This link is personal and works once. Please don't share it.`;
  return { subject: "Payment received — fill in your webpage details", html, text };
}

export function paymentFailedEmail(p: {
  name: string | null;
  productName: string;
  amount: string;
  reason: string | null;
  retryUrl: string;
}): EmailContent {
  const reason = p.reason ? `<p>Reason given by your bank or card provider: ${escapeHtml(p.reason)}</p>` : "";
  const html = emailLayout(
    "Your payment didn't go through",
    `<p>${escapeHtml(greeting(p.name))}</p>
<p>We couldn't take your payment of <strong>${escapeHtml(p.amount)}</strong> for <strong>${escapeHtml(p.productName)}</strong>, so you have not been charged.</p>
${reason}
<p>Please try again using the new link below. You can use a different card if you need to.</p>
${button(p.retryUrl, "Try again")}
<p>Or copy this link: <a href="${escapeHtml(p.retryUrl)}" style="color:#0E5A4E">${escapeHtml(p.retryUrl)}</a></p>`,
  );
  const text = `${greeting(p.name)}

We couldn't take your payment of ${p.amount} for ${p.productName}, so you have not been charged.
${p.reason ? `\nReason given by your bank or card provider: ${p.reason}\n` : ""}
Please try again using this new link. You can use a different card if you need to:
${p.retryUrl}`;
  return { subject: "Your payment didn't go through — please try again", html, text };
}

export type AdminPaymentAlert = "paid" | "failed" | "refunded" | "disputed" | "replace_failed";

const ALERT_TITLES: Record<AdminPaymentAlert, string> = {
  paid: "New payment received",
  failed: "A client payment failed",
  refunded: "A payment was refunded",
  disputed: "A payment was disputed",
  replace_failed: "A paid webpage needs attention",
};

export function adminPaymentEmail(p: {
  kind: AdminPaymentAlert;
  details: readonly [string, string][];
  note: string;
  dashboardUrl: string;
}): EmailContent {
  const title = ALERT_TITLES[p.kind];
  const rows = p.details
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#52606d;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const html = emailLayout(
    title,
    `<p>${escapeHtml(p.note)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">${rows}</table>
${button(p.dashboardUrl, "Open payments")}`,
  );
  const text = `${p.note}

${p.details.map(([k, v]) => `${k}: ${v}`).join("\n")}

Open payments: ${p.dashboardUrl}`;
  return { subject: `[Affordabiz] ${title}`, html, text };
}
