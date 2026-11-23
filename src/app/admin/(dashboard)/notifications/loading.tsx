export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-5" role="status" aria-label="Loading notifications">
      <div className="h-8 w-44 rounded-lg bg-slate-200" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 border-b border-slate-100 bg-slate-50/60" />
        ))}
      </div>
    </div>
  );
}
