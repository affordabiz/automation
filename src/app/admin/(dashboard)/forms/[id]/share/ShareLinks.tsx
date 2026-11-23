"use client";

import { Check, Code2, Copy, ExternalLink, Link2 } from "lucide-react";
import { useState } from "react";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setFailed(false);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          setFailed(true);
        }
      }}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {failed ? "Select and copy" : copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ShareLinks({ link, embed, published }: { link: string; embed: string; published: boolean }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {!published ? (
        <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This form is a draft. Publish it from the Build tab before sharing, or visitors will see a not-found page.
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-teal-50 text-teal-700"><Link2 className="size-4" aria-hidden /></span>
          <div>
            <h2 className="font-semibold">Public link</h2>
            <p className="text-sm text-slate-500">Share it by email, text or social media.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={link} aria-label="Public form link" onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700 outline-none focus:border-teal-700" />
          <CopyButton value={link} label="Copy public link" />
          {published ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <ExternalLink className="size-4" aria-hidden /> Open
            </a>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-700"><Code2 className="size-4" aria-hidden /></span>
            <div>
              <h2 className="font-semibold">Embed code</h2>
              <p className="text-sm text-slate-500">Paste this into any website. The height adjusts automatically.</p>
            </div>
          </div>
          <CopyButton value={embed} label="Copy embed code" />
        </div>
        <pre tabIndex={0} className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100"><code>{embed}</code></pre>
      </section>
    </div>
  );
}
