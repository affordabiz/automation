import { LogOut } from "lucide-react";
import { Suspense } from "react";
import { requireMember } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { signOutAction } from "../(auth)/actions";
import { AdminNav } from "../_components/AdminNav";
import { NotificationBell, NotificationBellFallback } from "../_components/NotificationBell";

function ShellFallback() {
  return <p className="p-8 text-sm text-slate-500">Loading dashboard…</p>;
}

async function Shell({ children }: { children: React.ReactNode }) {
  const member = await requireMember();
  return (
    <div className="lg:flex lg:min-h-screen">
      <aside className="bg-teal-950 px-4 py-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:py-6">
        <p className="mb-3 px-3 text-lg font-bold tracking-tight lg:mb-6">Affordabiz</p>
        <AdminNav isOwner={member.isOwner} permissions={[...member.permissions]} />
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 px-3 pt-3 lg:mt-auto">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{member.fullName}</p>
            <p className="truncate text-xs text-teal-100/70">{member.roleName}</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-teal-50 hover:bg-white/10">
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {hasPermission(member, "entries.view") ? (
          <div className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-10">
            <Suspense fallback={<NotificationBellFallback />}>
              <NotificationBell />
            </Suspense>
          </div>
        ) : null}
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
