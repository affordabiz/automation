import { escapeHtml } from "./escape";
import { emailLayout, type EmailContent } from "./layout";

export function contactMessageEmail(p: {
  businessName: string; name: string; email: string; phone: string; message: string; pageUrl: string;
}): EmailContent {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#52606d;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0">${value}</td></tr>`;
  const html = emailLayout(
    `New enquiry for ${p.businessName}`,
    `<p>You have a new message from your webpage.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px">
${row("Name", escapeHtml(p.name))}
${row("Email", `<a href="mailto:${escapeHtml(p.email)}" style="color:#0E5A4E">${escapeHtml(p.email)}</a>`)}
${row("Phone", escapeHtml(p.phone || "—"))}
</table>
<p style="margin-top:18px;padding:16px;background:#EAF3F0;border-radius:8px">${escapeHtml(p.message).replace(/\r?\n/g, "<br>")}</p>
<p style="font-size:13px;color:#52606d">Reply to this email to respond directly. Sent from <a href="${escapeHtml(p.pageUrl)}" style="color:#0E5A4E">${escapeHtml(p.pageUrl)}</a></p>`,
  );
  const text = `New enquiry for ${p.businessName}

Name: ${p.name}
Email: ${p.email}
Phone: ${p.phone || "—"}

${p.message}

Sent from ${p.pageUrl}`;
  return { subject: `New enquiry from ${p.name} via your website`, html, text };
}
