import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-24">
      <div className="max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Affordabiz</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
          Your professional webpage, live in minutes.
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Pick a template, add your details and logo, and get a shareable link straight away.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/create"
            className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Create my webpage
          </Link>
          <Link
            href="/templates/1/preview"
            target="_blank"
            className="rounded-full px-7 py-3.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-white"
          >
            Preview a template
          </Link>
        </div>
      </div>
    </main>
  );
}
