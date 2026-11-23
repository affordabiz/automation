import { ENTRY_STATUS_LABELS, type EntryStatus } from "@/lib/entries/mapping";

const STYLES: Record<EntryStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-teal-50 text-teal-800",
  rejected: "bg-red-50 text-red-800",
  suspended: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: { status: EntryStatus }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STYLES[status]}`}>{ENTRY_STATUS_LABELS[status]}</span>;
}
