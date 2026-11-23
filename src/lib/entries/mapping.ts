import type { SiteData } from "@/templates/types";

export type EntryStatus = "approved" | "pending" | "draft" | "suspended";

export const ENTRY_STATUSES: readonly EntryStatus[] = ["approved", "pending", "draft", "suspended"];

export const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
  approved: "Active",
  pending: "Pending Review",
  draft: "Draft",
  suspended: "Suspended",
};

export interface EntryListItem {
  id: string;
  status: EntryStatus;
  slug: string;
  template_number: number;
  full_name: string;
  business_name: string;
  created_at: string;
}

export interface LiveEntryRow {
  id: string;
  slug: string;
  template_number: number;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  serving_area: string;
  logo_url: string | null;
  photo_url: string | null;
}

export interface EntryMessage {
  id: string;
  entry_id: string;
  direction: "outbound" | "inbound";
  body: string;
  author_name: string;
  email_status: "sent" | "failed" | "not_sent" | null;
  read_at: string | null;
  created_at: string;
}

export function toSiteData(row: LiveEntryRow, images?: { logoUrl: string; photoUrl: string }): SiteData | null {
  const logoUrl = images?.logoUrl ?? row.logo_url;
  const photoUrl = images?.photoUrl ?? row.photo_url;
  const n = row.template_number;
  if (!Number.isInteger(n) || n < 1 || n > 7 || !logoUrl || !photoUrl) return null;
  return {
    id: row.id,
    slug: row.slug,
    templateNumber: n,
    fullName: row.full_name,
    businessName: row.business_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    servingArea: row.serving_area,
    logoUrl,
    photoUrl,
  };
}
