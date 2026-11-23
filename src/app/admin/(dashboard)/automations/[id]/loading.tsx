export default function AutomationLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-5" role="status" aria-label="Loading automation">
      <div className="h-14 rounded-xl border border-slate-200 bg-white" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-[32rem] rounded-2xl border border-slate-200 bg-white" />
        <div className="h-72 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
