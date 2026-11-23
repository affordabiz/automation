export default function AutomationsLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" role="status" aria-label="Loading automations">
      <div className="flex justify-between">
        <div className="h-8 w-44 rounded-lg bg-slate-200" />
        <div className="h-10 w-36 rounded-lg bg-slate-200" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-44 rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
