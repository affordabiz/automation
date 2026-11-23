const MAX_BODY = 10000;
const SPAM_THRESHOLD = 5;

interface Mailbox {
  Address?: unknown;
  Name?: unknown;
}

export interface InboundReply {
  token: string;
  fromEmail: string;
  fromName: string;
  body: string;
  messageId: string | null;
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function findToken(item: Record<string, unknown>, domain: string): string | null {
  const recipients = Array.isArray(item.Recipients) ? item.Recipients : [];
  const to = Array.isArray(item.To) ? (item.To as Mailbox[]).map((m) => m?.Address) : [];
  const expected = `@${domain.toLowerCase()}`;
  for (const raw of [...recipients, ...to]) {
    const address = text(raw).toLowerCase();
    if (!address.endsWith(expected)) continue;
    const match = address.slice(0, -expected.length).match(/^reply\+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/);
    if (match) return match[1];
  }
  return null;
}

/** Reads one Brevo inbound item. The body is stored and displayed as plain text only. */
export function parseInboundItem(item: unknown, domain: string): InboundReply | null {
  if (typeof item !== "object" || item === null) return null;
  const record = item as Record<string, unknown>;
  const spam = record.Spam as { Score?: unknown } | undefined;
  const score = typeof record.SpamScore === "number" ? record.SpamScore : spam?.Score;
  if (typeof score === "number" && score >= SPAM_THRESHOLD) return null;

  const token = findToken(record, domain);
  const from = record.From as Mailbox | undefined;
  const fromEmail = text(from?.Address).toLowerCase();
  const body = (text(record.ExtractedMarkdownMessage) || text(record.RawTextBody)).slice(0, MAX_BODY);
  if (!token || !fromEmail || !body) return null;

  return {
    token,
    fromEmail,
    fromName: text(from?.Name) || fromEmail,
    body,
    messageId: text(record.MessageId) || null,
  };
}
