import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/admin/auth";
import { formatDate, listAudit, listMembers, listRoles } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { countEntries } from "@/lib/entries/store";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const member = await requireMember();
  const canSeeTeam = hasPermission(member, "team.view");
  const canSeeAudit = hasPermission(member, "audit.view");
  const canSeeRoles = hasPermission(member, "roles.manage");

  const canSeeEntries = hasPermission(member, "entries.view");
  const canSeePages = hasPermission(member, "webpages.view");

  const [members, roles, activity, pending, live] = await Promise.all([
    canSeeTeam ? listMembers() : null,
    canSeeRoles ? listRoles() : null,
    canSeeAudit ? listAudit(8) : null,
    canSeeEntries ? countEntries("pending") : null,
    canSeePages ? countEntries("approved") : null,
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {member.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-600">Signed in as {member.roleName}.</p>
      </header>

      {denied ? (
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You don&apos;t have access to that page.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pending !== null ? <Stat label="Entries awaiting review" value={pending} href="/admin/entries?status=pending" /> : null}
        {live !== null ? <Stat label="Live webpages" value={live} href="/admin/webpages" /> : null}
        {members ? <Stat label="Team members" value={members.length} href="/admin/team" /> : null}
        {roles ? <Stat label="Roles" value={roles.length} href="/admin/roles" /> : null}
      </div>

      {activity ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link href="/admin/audit" className="text-sm font-medium text-teal-800 hover:underline">View all</Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activity.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span><span className="font-medium">{a.actor_email ?? "System"}</span> · {a.action}</span>
                  <time className="text-slate-500" dateTime={a.created_at}>{formatDate(a.created_at)} UTC</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-teal-700">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </Link>
  );
}
