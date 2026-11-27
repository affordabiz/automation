import "server-only";
import { sendEmail } from "@/lib/brevo";
import { adminAccessEmail } from "@/lib/emails/adminAccess";
import { siteBase } from "@/lib/siteUrl";

export type AccessLinkKind = "invite" | "recovery";

/** Links open a page that only consumes the token on submit, so email scanners cannot use it up. */
export function accessLinkUrl(tokenHash: string, kind: AccessLinkKind): string {
  const base = siteBase();
  const params = new URLSearchParams({ token_hash: tokenHash, type: kind });
  return `${base}/admin/set-password?${params}`;
}

export interface Delivery {
  delivered: boolean;
  /** Only set for local development while email dry-run is on. */
  previewLink?: string;
}

export async function deliverAccessLink(
  to: { email: string; fullName: string },
  tokenHash: string,
  kind: AccessLinkKind,
): Promise<Delivery> {
  const url = accessLinkUrl(tokenHash, kind);
  const result = await sendEmail({
    to: { email: to.email, name: to.fullName },
    ...adminAccessEmail({ fullName: to.fullName, url, kind }),
  });
  if (!result.ok) {
    console.error("[admin] access email failed", result.error);
    return { delivered: false };
  }
  if (result.messageId === "dry-run") {
    return { delivered: false, previewLink: process.env.NODE_ENV === "production" ? undefined : url };
  }
  return { delivered: true };
}
