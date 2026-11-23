import { escapeHtml } from "./escape";
import { emailLayout, type EmailContent } from "./layout";

export function adminAccessEmail(p: { fullName: string; url: string; kind: "invite" | "recovery" }): EmailContent {
  const invite = p.kind === "invite";
  const title = invite ? "You're invited to Affordabiz Admin" : "Reset your Affordabiz Admin password";
  const intro = invite
    ? "You've been added to the Affordabiz admin team. Set your password to get started."
    : "We received a request to reset your password. If this wasn't you, you can ignore this email.";
  const action = invite ? "Accept invitation" : "Reset password";
  const url = escapeHtml(p.url);
  const html = emailLayout(
    title,
    `<p>Hi ${escapeHtml(p.fullName)},</p>
<p>${intro}</p>
<p style="margin:28px 0"><a href="${url}" style="background:#F7931E;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">${action}</a></p>
<p style="font-size:13px;color:#52606d">This link can only be used once and expires soon. Never share it.</p>`,
  );
  const text = `Hi ${p.fullName},

${intro}

${action}: ${p.url}

This link can only be used once and expires soon. Never share it.`;
  return { subject: title, html, text };
}
