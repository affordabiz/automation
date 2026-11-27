"use client";

import { ArrowLeft, Inbox, PencilRuler, Share2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FormTabs({ id, name, published }: { id: string; name: string; published: boolean }) {
  const pathname = usePathname();
  const base = `/admin/forms/${id}`;
  const tabs = [
    { href: `${base}/submissions`, label: "Responses", icon: Inbox, active: pathname === `${base}/submissions` },
    { href: base, label: "Build", icon: PencilRuler, active: pathname === base },
    { href: `${base}/share`, label: "Share", icon: Share2, active: pathname === `${base}/share` },
  ];
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/admin/forms" aria-label="Back to forms" className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <h1 className="truncate text-lg font-semibold tracking-tight">{name}</h1>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${published ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-slate-100 text-slate-700 ring-slate-500/15"}`}>
          {published ? "Published" : "Draft"}
        </span>
      </div>
      <nav aria-label="Form sections" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 md:flex">
        {tabs.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
