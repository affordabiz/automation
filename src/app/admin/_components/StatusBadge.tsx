import { ENTRY_STATUS_LABELS, type EntryStatus } from "@/lib/entries/mapping";

const STYLES: Record<EntryStatus, { badge: string; dot: string }> = {
  approved: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
  pending: { badge: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  draft: { badge: "bg-slate-100 text-slate-700 ring-slate-500/15", dot: "bg-slate-400" },
  suspended: { badge: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500" },
};

export function StatusBadge({ status }: { status: EntryStatus }) {
  const style = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
      {ENTRY_STATUS_LABELS[status]}
    </span>
  );
}
