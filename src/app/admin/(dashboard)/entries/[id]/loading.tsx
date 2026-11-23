export default function EntryLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" role="status" aria-label="Loading entry">
      <div className="h-5 w-32 rounded bg-slate-200" />
      <div className="flex flex-wrap justify-between gap-3">
        <div className="h-9 w-64 rounded-lg bg-slate-200" />
        <div className="h-10 w-72 rounded-lg bg-slate-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
        <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
