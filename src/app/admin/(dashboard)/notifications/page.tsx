import { ArrowDownLeft, ArrowUpRight, Bell } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { listNotifications } from "@/lib/entries/store";
import { MarkAllRead } from "./MarkAllRead";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requirePermission("entries.view");
  const items = await listNotifications();
  const unread = items.filter((i) => i.direction === "inbound" && !i.read_at).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {unread > 0 ? `${unread} unread ${unread === 1 ? "reply" : "replies"}` : "Client email history"}
          </p>
        </div>
        {unread > 0 ? <MarkAllRead /> : null}
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Bell className="mx-auto size-7 text-slate-400" aria-hidden />
          <p className="mt-3 font-medium text-slate-700">No emails yet</p>
          <p className="mt-1 text-sm text-slate-500">Client emails and replies will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map((item) => {
            const inbound = item.direction === "inbound";
            const isUnread = inbound && !item.read_at;
            const Icon = inbound ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={item.id}>
                <Link href={`/admin/entries/${item.entry_id}`} prefetch={false} className={`flex gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${isUnread ? "bg-teal-50/50" : ""}`}>
                  <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${inbound ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className={`truncate text-sm ${isUnread ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>
                        {inbound ? `${item.entries.full_name} replied` : `Email to ${item.entries.full_name}`}
                      </span>
                      <time dateTime={item.created_at} className="text-xs text-slate-500">{formatDate(item.created_at)}</time>
                    </span>
                    <span className="block truncate text-xs text-slate-500">{item.entries.business_name}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-slate-600">{item.body}</span>
                  </span>
                  {isUnread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-teal-600"><span className="sr-only">Unread</span></span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
