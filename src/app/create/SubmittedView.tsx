"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, Mail, MailCheck, Plus, ScanSearch, Send } from "lucide-react";
import { lockScroll } from "@/lib/smoothScroll";

type Props = { email: string; url?: string };

const CONFETTI = [
  ["-9rem", "-6rem", "#10b981", "0ms"],
  ["-6rem", "-9rem", "#f59e0b", "60ms"],
  ["-2rem", "-10rem", "#0ea5e9", "20ms"],
  ["2.5rem", "-10rem", "#f43f5e", "90ms"],
  ["6rem", "-8.5rem", "#10b981", "40ms"],
  ["9rem", "-5rem", "#8b5cf6", "110ms"],
  ["-10rem", "-1rem", "#0ea5e9", "130ms"],
  ["10rem", "-1.5rem", "#f59e0b", "70ms"],
  ["-7rem", "4rem", "#8b5cf6", "150ms"],
  ["7.5rem", "4rem", "#10b981", "30ms"],
  ["-3rem", "6rem", "#f43f5e", "100ms"],
  ["3.5rem", "6.5rem", "#0ea5e9", "170ms"],
] as const;

/** Animated "webpage being reviewed" illustration (pure SVG + CSS). */
function ReviewIllustration({ live }: { live: boolean }) {
  return (
    <div className="relative mx-auto size-60 sm:size-64" aria-hidden>
      {/* soft halo + orbit rings */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-200/70 via-sky-200/60 to-violet-200/60 blur-2xl" />
      <div className="absolute inset-0 rounded-full border border-dashed border-emerald-300/70 motion-safe:animate-[ab-spin_28s_linear_infinite]">
        <span className="absolute top-3 left-1/2 size-3 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
      </div>
      <div className="absolute inset-7 rounded-full border border-sky-200/80 motion-safe:animate-[ab-spin_18s_linear_infinite_reverse]">
        <span className="absolute bottom-2 left-1/2 size-2 -translate-x-1/2 rounded-full bg-sky-400" />
      </div>

      {/* confetti burst */}
      <div className="absolute top-1/2 left-1/2 motion-reduce:hidden">
        {CONFETTI.map(([x, y, c, d], i) => (
          <span
            key={i}
            className="absolute size-2 rounded-[2px] opacity-0 motion-safe:animate-[ab-confetti_1.4s_cubic-bezier(.2,.7,.3,1)_forwards]"
            style={{ "--tx": x, "--ty": y, background: c, animationDelay: d } as CSSProperties}
          />
        ))}
      </div>

      {/* browser card */}
      <div className="absolute inset-0 grid place-items-center motion-safe:animate-[ab-float_6s_ease-in-out_infinite]">
        <div className="relative w-40 overflow-hidden rounded-2xl bg-white shadow-[0_25px_50px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-200 sm:w-48">
          <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="ml-2 h-2 flex-1 rounded-full bg-slate-200" />
          </div>
          <div className="space-y-2 p-3">
            <div className="h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 sm:h-12" />
            <div className="ab-shimmer h-2 w-4/5 rounded-full" />
            <div className="ab-shimmer h-2 w-3/5 rounded-full" />
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="ab-shimmer h-6 rounded-md" />
              <div className="ab-shimmer h-6 rounded-md" />
              <div className="ab-shimmer h-6 rounded-md" />
            </div>
            <div className="ab-shimmer h-2 w-2/3 rounded-full" />
          </div>
          {!live && (
            <div className="pointer-events-none absolute inset-x-0 top-8 h-10 bg-gradient-to-b from-transparent via-emerald-300/40 to-transparent motion-safe:animate-[ab-scan_2.8s_ease-in-out_infinite]" />
          )}
        </div>

        {live ? (
          <span className="absolute right-6 bottom-10 grid size-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-white motion-safe:animate-[ab-pop_.6s_.3s_cubic-bezier(.3,1.6,.5,1)_both] sm:right-8">
            <Check className="size-7" strokeWidth={3} />
          </span>
        ) : (
          <span className="absolute top-1/2 left-1/2 motion-safe:animate-[ab-magnify_5s_ease-in-out_infinite]">
            <svg viewBox="0 0 64 64" className="size-14 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg sm:size-16">
              <circle cx="26" cy="26" r="17" fill="rgba(255,255,255,0.55)" stroke="#0f172a" strokeWidth="5" />
              <circle cx="20" cy="20" r="5" fill="white" opacity=".9" />
              <path d="M39 39l15 15" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>

      {/* sparkles */}
      {[
        "top-6 right-8 text-amber-400",
        "bottom-8 left-5 text-sky-400 [animation-delay:.8s]",
        "top-16 left-3 text-violet-400 [animation-delay:1.6s]",
      ].map((c) => (
        <svg key={c} viewBox="0 0 24 24" className={`absolute size-4 fill-current motion-safe:animate-[ab-twinkle_2.4s_ease-in-out_infinite] ${c}`}>
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
        </svg>
      ))}
    </div>
  );
}

const STEPS = [
  { icon: Send, title: "Request submitted", text: "We've received your details." },
  { icon: ScanSearch, title: "Team review", text: "We're checking your webpage." },
  { icon: MailCheck, title: "Link emailed", text: "Your webpage link lands in your inbox." },
];

function Timeline({ live }: { live: boolean }) {
  const active = live ? 3 : 1;
  return (
    <ol className="grid gap-3 text-left sm:grid-cols-3 sm:gap-4">
      {STEPS.map(({ icon: Icon, title, text }, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li
            key={title}
            className={`relative flex items-start gap-3 rounded-2xl p-4 ring-1 transition sm:flex-col sm:gap-3 ${
              current ? "bg-white shadow-md shadow-emerald-900/5 ring-emerald-300" : done ? "bg-emerald-50/70 ring-emerald-100" : "bg-white/60 ring-slate-200"
            }`}
          >
            <span
              className={`relative grid size-10 shrink-0 place-items-center rounded-xl ${
                done ? "bg-emerald-500 text-white" : current ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {current && <span className="absolute inset-0 rounded-xl bg-slate-900/40 motion-safe:animate-ping" />}
              {done ? <Check className="size-5" strokeWidth={3} /> : <Icon className="relative size-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Step {i + 1}</p>
              <p className={`mt-0.5 font-semibold ${done || current ? "text-slate-900" : "text-slate-500"}`}>{title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{current ? "In progress…" : text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Full-screen confirmation shown after the /create form is submitted. */
export function SubmittedView({ email, url }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const live = Boolean(url);

  useEffect(() => {
    lockScroll(true);
    heading.current?.focus();
    return () => lockScroll(false);
  }, []);

  return (
    <main
      data-lenis-prevent
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-gradient-to-br from-slate-50 via-white to-emerald-50"
    >
      {/* animated background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-emerald-300/30 blur-3xl motion-safe:animate-[ab-blob_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-32 size-[28rem] rounded-full bg-sky-300/25 blur-3xl motion-safe:animate-[ab-blob_18s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-40 left-1/4 size-96 rounded-full bg-violet-300/20 blur-3xl motion-safe:animate-[ab-blob_16s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(#0f172a0d_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <div className="relative mx-auto flex min-h-full max-w-3xl flex-col px-5 py-8 sm:py-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-bold tracking-widest text-slate-900 uppercase">
            Affordabiz
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur">
            <span className="relative flex size-2">
              <span className={`absolute inset-0 rounded-full ${live ? "bg-emerald-500" : "bg-amber-400 motion-safe:animate-ping"}`} />
              <span className={`relative size-2 rounded-full ${live ? "bg-emerald-500" : "bg-amber-500"}`} />
            </span>
            {live ? "Published" : "Pending review"}
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-8 text-center sm:py-4 motion-safe:animate-[ab-rise_.7s_cubic-bezier(.2,.8,.2,1)_both]">
          <ReviewIllustration live={live} />

          <h1
            ref={heading}
            tabIndex={-1}
            className="mt-6 text-3xl font-semibold sm:mt-4 tracking-tight text-balance text-slate-900 outline-none sm:text-5xl"
          >
            {live ? "Your webpage is live" : "Your request is under review"}
          </h1>

          {live ? (
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
              Your webpage has been published and is ready to share.
            </p>
          ) : (
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Once our team approves your webpage, we&apos;ll email the link to
            </p>
          )}

          {!live && (
            <div className="mx-auto mt-4 inline-flex max-w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 sm:px-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <Mail className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 text-left font-semibold break-all text-slate-900">{email}</span>
            </div>
          )}

          {!live && (
            <div className="mt-10 sm:mt-8">
              <Timeline live={live} />
            </div>
          )}

          {!live && (
            <p className="mt-6 text-sm text-slate-500 sm:mt-5">
              Can&apos;t find our email? Check your spam or promotions folder.
            </p>
          )}

          <div className="mt-8 flex flex-col items-stretch sm:mt-6 justify-center gap-3 sm:flex-row sm:items-center">
            {live && url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="size-4 shrink-0" aria-hidden />
              </a>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back to home
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 transition hover:-translate-y-0.5 hover:ring-slate-400"
            >
              <Plus className="size-4" aria-hidden />
              Create another webpage
            </button>
          </div>
        </div>

        <footer className="pt-4 text-center text-xs text-slate-400">© Affordabiz</footer>
      </div>
    </main>
  );
}
