import { Bell } from "lucide-react";
import Link from "next/link";
import { countUnreadMessages } from "@/lib/entries/store";

export async function NotificationBell() {
  const unread = await countUnreadMessages().catch(() => 0);
  return (
    <Link
      href="/admin/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative grid size-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-700"
    >
      <Bell className="size-5" aria-hidden />
      {unread > 0 ? (
        <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

export function NotificationBellFallback() {
  return (
    <span className="grid size-10 place-items-center text-slate-400" aria-hidden>
      <Bell className="size-5" />
    </span>
  );
}
