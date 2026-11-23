export default function EntriesLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" role="status" aria-label="Loading entries">
      <div className="h-8 w-40 rounded-lg bg-slate-200" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-slate-200" />
        ))}
      </div>
      <div className="space-y-px overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-b border-slate-100 bg-slate-50/60" />
        ))}
      </div>
    </div>
  );
}
