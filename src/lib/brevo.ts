const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export interface EmailAddress { email: string; name?: string }
export interface EmailMessage {
  to: EmailAddress;
  subject: string;
  html: string;
  text: string;
  replyTo?: EmailAddress;
}
export type SendResult = { ok: true; messageId?: string } | { ok: false; error: string };

function isDryRun(): boolean {
  const v = (process.env.BREVO_DRY_RUN ?? "").trim().toLowerCase();
  return v === "1" || v === "true";
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  if (isDryRun()) {
    console.info("[brevo:dry-run]", msg.to.email, msg.subject);
    return { ok: true, messageId: "dry-run" };
  }
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) return { ok: false, error: "Brevo is not configured" };

  try {
    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || "Affordabiz" },
        to: [msg.to],
        subject: msg.subject,
        htmlContent: msg.html,
        textContent: msg.text,
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
      }),
    });
    if (!res.ok) return { ok: false, error: `Brevo ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { messageId?: string };
    return { ok: true, messageId: data.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
