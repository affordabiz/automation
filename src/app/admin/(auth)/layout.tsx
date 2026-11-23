import { Suspense } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-lg font-bold tracking-tight text-teal-900">Affordabiz Admin</p>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>{children}</Suspense>
        </div>
      </div>
    </main>
  );
}
