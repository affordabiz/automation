export default function SubmissionsLoading() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading responses">
      <div className="h-10 w-full max-w-sm rounded-lg bg-slate-200" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 border-b border-slate-100 bg-slate-50/60" />
        ))}
      </div>
    </div>
  );
}
