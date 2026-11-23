"use client";

import { CheckCheck, LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import { markAllNotificationsReadAction } from "../entries/actions";

export function MarkAllRead() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => markAllNotificationsReadAction())}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <CheckCheck className="size-4" aria-hidden />}
      Mark all read
    </button>
  );
}
