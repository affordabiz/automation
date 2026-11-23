export default function FormsLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" role="status" aria-label="Loading forms">
      <div className="flex justify-between">
        <div className="h-8 w-32 rounded-lg bg-slate-200" />
        <div className="h-10 w-28 rounded-lg bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
